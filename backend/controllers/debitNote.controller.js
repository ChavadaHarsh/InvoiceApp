const db = require("../config/db");

/* =====================================================
   CREATE DEBIT NOTE (PURCHASE RETURN)
===================================================== */
exports.createDebitNote = (req, res) => {
  const {
    company_id,
    party_id,
    invoice_id,

    debit_note_no,
    debit_note_date,

    purchase_ledger_id,
    input_gst_ledger_id,

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
    INSERT INTO debit_notes (
      company_id, party_id, invoice_id,
      debit_note_no, debit_note_date,
      taxable_amount, gst_amount, total_amount,
      reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      company_id,
      party_id,
      invoice_id,
      debit_note_no,
      debit_note_date,
      taxable,
      gst,
      total,
      reason,
    ],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });

      const debitNoteId = this.lastID;

      items.forEach((item) => {
        // items
        db.run(
          `
          INSERT INTO debit_note_items (
            debit_note_id, product_id,
            qty, rate,
            taxable_amount, gst_rate, gst_amount, total_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            debitNoteId,
            item.product_id,
            item.qty,
            item.rate,
            item.taxable_amount,
            item.gst_rate,
            item.gst_amount,
            item.total_amount,
          ]
        );

        // stock reduce
        db.run(
          `UPDATE products
           SET opening_stock = opening_stock - ?
           WHERE id = ?`,
          [item.qty, item.product_id]
        );
      });

      /* LEDGER REVERSAL */

      // Supplier debit
      db.run(
        `
        INSERT INTO ledger_entries
        (company_id, ledger_id, voucher_type, voucher_no, voucher_date, debit, credit, narration)
        VALUES (?, ?, 'debit_note', ?, ?, ?, 0, ?)
        `,
        [company_id, party_id, debit_note_no, debit_note_date, total, reason]
      );

      // Purchase credit
      db.run(
        `
        INSERT INTO ledger_entries
        VALUES (NULL, ?, ?, 'debit_note', ?, ?, 0, ?, ?, ?)
        `,
        [
          company_id,
          purchase_ledger_id,
          debit_note_no,
          debit_note_date,
          taxable,
          reason,
        ]
      );

      // Input GST credit
      if (gst > 0) {
        db.run(
          `
          INSERT INTO ledger_entries
          VALUES (NULL, ?, ?, 'debit_note', ?, ?, 0, ?, ?, ?)
          `,
          [
            company_id,
            input_gst_ledger_id,
            debit_note_no,
            debit_note_date,
            gst,
            reason,
          ]
        );
      }

      res.json({ success: true, debit_note_id: debitNoteId });
    }
  );
};
exports.cancelDebitNote = (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM debit_notes WHERE id = ?`, [id], (err, dn) => {
    if (err || !dn) {
      return res.status(404).json({ error: "Debit note not found" });
    }

    if (dn.status === "cancelled") {
      return res.status(400).json({ error: "Debit note already cancelled" });
    }

    /* 1️⃣ RESTORE STOCK (REVERSE PURCHASE RETURN) */
    db.all(
      `SELECT * FROM debit_note_items WHERE debit_note_id = ?`,
      [id],
      (err, items) => {
        items.forEach((item) => {
          db.run(
            `
              UPDATE products
              SET opening_stock = opening_stock + ?
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
              'debit_note_cancel',
              voucher_no,
              DATE('now'),
              credit,
              debit,
              'Debit Note Cancelled'
            FROM ledger_entries
            WHERE voucher_no = ?
              AND voucher_type = 'debit_note'
            `,
          [dn.debit_note_no]
        );

        /* 3️⃣ MARK DEBIT NOTE CANCELLED */
        db.run(
          `
            UPDATE debit_notes
            SET status = 'cancelled'
            WHERE id = ?
            `,
          [id],
          () => {
            res.json({
              success: true,
              message: "Debit note cancelled successfully",
            });
          }
        );
      }
    );
  });
};
