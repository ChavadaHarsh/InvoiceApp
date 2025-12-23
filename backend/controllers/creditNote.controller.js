const db = require("../config/db");

/* =====================================================
   CREATE CREDIT NOTE (SALES RETURN)
===================================================== */
exports.createCreditNote = (req, res) => {
  const {
    company_id,
    party_id,
    invoice_id,

    credit_note_no,
    credit_note_date,

    sales_ledger_id,
    output_gst_ledger_id,

    items,
    reason,
  } = req.body;

  let taxable = 0,
    gst = 0,
    total = 0;

  items.forEach((i) => {
    taxable += i.taxable_amount;
    gst += i.gst_amount;
    total += i.total_amount;
  });

  db.run(
    `
    INSERT INTO credit_notes (
      company_id, party_id, invoice_id,
      credit_note_no, credit_note_date,
      taxable_amount, gst_amount, total_amount,
      reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      company_id,
      party_id,
      invoice_id,
      credit_note_no,
      credit_note_date,
      taxable,
      gst,
      total,
      reason,
    ],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });

      const creditNoteId = this.lastID;

      items.forEach((item) => {
        // items
        db.run(
          `
          INSERT INTO credit_note_items (
            credit_note_id, product_id,
            qty, rate,
            taxable_amount, gst_rate, gst_amount, total_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            creditNoteId,
            item.product_id,
            item.qty,
            item.rate,
            item.taxable_amount,
            item.gst_rate,
            item.gst_amount,
            item.total_amount,
          ]
        );

        // stock back
        db.run(
          `UPDATE products
           SET opening_stock = opening_stock + ?
           WHERE id = ?`,
          [item.qty, item.product_id]
        );
      });

      /* LEDGER REVERSAL (TALLY STYLE) */

      // Customer credit
      db.run(
        `
        INSERT INTO ledger_entries
        (company_id, ledger_id, voucher_type, voucher_no, voucher_date, debit, credit, narration)
        VALUES (?, ?, 'credit_note', ?, ?, 0, ?, ?)
        `,
        [company_id, party_id, credit_note_no, credit_note_date, total, reason]
      );

      // Sales debit
      db.run(
        `
        INSERT INTO ledger_entries
        VALUES (NULL, ?, ?, 'credit_note', ?, ?, ?, 0, ?, ?)
        `,
        [
          company_id,
          sales_ledger_id,
          credit_note_no,
          credit_note_date,
          taxable,
          reason,
        ]
      );

      // Output GST debit
      if (gst > 0) {
        db.run(
          `
          INSERT INTO ledger_entries
          VALUES (NULL, ?, ?, 'credit_note', ?, ?, ?, 0, ?, ?)
          `,
          [
            company_id,
            output_gst_ledger_id,
            credit_note_no,
            credit_note_date,
            gst,
            reason,
          ]
        );
      }

      res.json({ success: true, credit_note_id: creditNoteId });
    }
  );
};
exports.cancelCreditNote = (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM credit_notes WHERE id = ?`, [id], (err, cn) => {
    if (err || !cn) {
      return res.status(404).json({ error: "Credit note not found" });
    }

    if (cn.status === "cancelled") {
      return res.status(400).json({ error: "Credit note already cancelled" });
    }

    /* 1️⃣ RESTORE STOCK (REVERSE SALES RETURN) */
    db.all(
      `SELECT * FROM credit_note_items WHERE credit_note_id = ?`,
      [id],
      (err, items) => {
        items.forEach((item) => {
          db.run(
            `
              UPDATE products
              SET opening_stock = opening_stock - ?
              WHERE id = ?
              `,
            [item.qty, item.product_id]
          );
        });

        /* 2️⃣ REVERSE LEDGER ENTRIES */
        db.run(
          `
            INSERT INTO ledger_entries (
              company_id,
              ledger_id,
              voucher_type,
              voucher_no,
              voucher_date,
              debit,
              credit,
              narration
            )
            SELECT
              company_id,
              ledger_id,
              'credit_note_cancel',
              voucher_no,
              DATE('now'),
              credit,
              debit,
              'Credit Note Cancelled'
            FROM ledger_entries
            WHERE voucher_no = ?
              AND voucher_type = 'credit_note'
            `,
          [cn.credit_note_no]
        );

        /* 3️⃣ MARK CREDIT NOTE CANCELLED */
        db.run(
          `
            UPDATE credit_notes
            SET status = 'cancelled'
            WHERE id = ?
            `,
          [id],
          () => {
            res.json({
              success: true,
              message: "Credit note cancelled successfully",
            });
          }
        );
      }
    );
  });
};
