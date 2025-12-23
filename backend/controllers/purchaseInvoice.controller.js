const db = require("../config/db");

/* =====================================================
   CREATE PURCHASE BILL (CASH / CREDIT + AUTO LEDGER)
===================================================== */
exports.createPurchaseInvoice = (req, res) => {
  const {
    company_id,
    party_id,
    invoice_no,
    invoice_date,
    purchase_type, // cash / credit

    purchase_ledger_id,
    input_gst_ledger_id,
    cash_ledger_id, // required for cash purchase

    invoice_discount = 0,
    extra_charges = 0,
    round_off = 0,

    items,
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: "Purchase items required" });
  }

  if (purchase_type === "credit" && !party_id) {
    return res
      .status(400)
      .json({ error: "Supplier required for credit purchase" });
  }

  let gross_amount = 0;
  let item_discount = 0;
  let gst_amount = 0;

  items.forEach((item) => {
    gross_amount += Number(item.gross_amount);
    item_discount += Number(item.discount_amount || 0);
    gst_amount += Number(item.gst_amount);
  });

  const taxable_amount =
    gross_amount - item_discount - Number(invoice_discount);

  const total_amount =
    taxable_amount + gst_amount + Number(extra_charges) + Number(round_off);

  /* ================= INSERT PURCHASE BILL ================= */
  db.run(
    `
    INSERT INTO purchase_invoices (
      company_id, party_id,
      invoice_no, invoice_date, purchase_type,
      gross_amount, item_discount, invoice_discount,
      taxable_amount, gst_amount,
      extra_charges, round_off,
      total_amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      company_id,
      purchase_type === "credit" ? party_id : null,
      invoice_no,
      invoice_date,
      purchase_type,
      gross_amount,
      item_discount,
      invoice_discount,
      taxable_amount,
      gst_amount,
      extra_charges,
      round_off,
      total_amount,
    ],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });

      const invoiceId = this.lastID;

      /* ========== ITEMS + STOCK INCREASE ========== */
      items.forEach((item) => {
        db.run(
          `
          INSERT INTO purchase_invoice_items (
            invoice_id, product_id,
            qty, rate,
            gross_amount,
            discount_percent, discount_amount,
            taxable_amount,
            gst_rate, gst_amount,
            total_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            invoiceId,
            item.product_id,
            item.qty,
            item.rate,
            item.gross_amount,
            item.discount_percent || 0,
            item.discount_amount || 0,
            item.taxable_amount,
            item.gst_rate,
            item.gst_amount,
            item.total_amount,
          ]
        );

        // increase stock
        db.run(
          `UPDATE products
           SET opening_stock = opening_stock + ?
           WHERE id = ?`,
          [item.qty, item.product_id]
        );
      });

      /* ================= LEDGER POSTING ================= */

      // 1️⃣ Debit Purchase Ledger (Expense)
      db.run(
        `
        INSERT INTO ledger_entries (
          company_id, ledger_id,
          voucher_type, voucher_no, voucher_date,
          debit, credit, narration
        ) VALUES (?, ?, 'purchase', ?, ?, ?, 0, ?)
        `,
        [
          company_id,
          purchase_ledger_id,
          invoice_no,
          invoice_date,
          taxable_amount,
          "Purchase Account",
        ]
      );

      // 2️⃣ Debit Input GST
      if (gst_amount > 0) {
        db.run(
          `
          INSERT INTO ledger_entries (
            company_id, ledger_id,
            voucher_type, voucher_no, voucher_date,
            debit, credit, narration
          ) VALUES (?, ?, 'purchase', ?, ?, ?, 0, ?)
          `,
          [
            company_id,
            input_gst_ledger_id,
            invoice_no,
            invoice_date,
            gst_amount,
            "Input GST",
          ]
        );
      }

      // 3️⃣ Credit Supplier OR Cash/Bank
      const creditLedger =
        purchase_type === "credit" ? party_id : cash_ledger_id;

      db.run(
        `
        INSERT INTO ledger_entries (
          company_id, ledger_id,
          voucher_type, voucher_no, voucher_date,
          debit, credit, narration
        ) VALUES (?, ?, 'purchase', ?, ?, 0, ?, ?)
        `,
        [
          company_id,
          creditLedger,
          invoice_no,
          invoice_date,
          total_amount,
          "Purchase Bill",
        ]
      );

      /* ================= UPDATE LEDGER BALANCES ================= */

      // Purchase ledger
      db.run(
        `UPDATE ledgers SET closing_balance = closing_balance + ? WHERE id = ?`,
        [taxable_amount, purchase_ledger_id]
      );

      // GST ledger
      if (gst_amount > 0) {
        db.run(
          `UPDATE ledgers SET closing_balance = closing_balance + ? WHERE id = ?`,
          [gst_amount, input_gst_ledger_id]
        );
      }

      // Supplier or Cash
      db.run(
        `UPDATE ledgers SET closing_balance = closing_balance - ? WHERE id = ?`,
        [total_amount, creditLedger]
      );

      res.json({
        success: true,
        purchase_invoice_id: invoiceId,
        purchase_type,
        total_amount,
      });
    }
  );
};

/* =====================================================
   CANCEL PURCHASE BILL (TALLY SAFE)
===================================================== */
exports.cancelPurchaseInvoice = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT * FROM purchase_invoices WHERE id = ?`,
    [id],
    (err, invoice) => {
      if (err || !invoice) {
        return res.status(404).json({ error: "Purchase bill not found" });
      }

      if (invoice.status === "cancelled") {
        return res
          .status(400)
          .json({ error: "Purchase bill already cancelled" });
      }

      /* 1️⃣ REVERSE STOCK */
      db.all(
        `SELECT * FROM purchase_invoice_items WHERE invoice_id = ?`,
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

          /* 2️⃣ REVERSE LEDGER ENTRIES (NO DELETE) */
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
              'purchase_cancel',
              voucher_no,
              DATE('now'),
              credit,
              debit,
              'Purchase Bill Cancelled'
            FROM ledger_entries
            WHERE voucher_no = ?
              AND voucher_type = 'purchase'
            `,
            [invoice.invoice_no]
          );

          /* 3️⃣ MARK CANCELLED */
          db.run(
            `
            UPDATE purchase_invoices
            SET status = 'cancelled'
            WHERE id = ?
            `,
            [id],
            () => {
              res.json({
                success: true,
                message: "Purchase bill cancelled successfully",
              });
            }
          );
        }
      );
    }
  );
};
