const db = require("../config/db");

/* =====================================================
   CREATE SALES INVOICE (CASH / CREDIT + AUTO LEDGER)
===================================================== */
exports.createSalesInvoice = (req, res) => {
  const {
    company_id,
    party_id,
    invoice_no,
    invoice_date,
    invoice_type, // cash / credit

    sales_ledger_id,
    output_gst_ledger_id,
    cash_ledger_id, // required for cash sale

    invoice_discount = 0,
    extra_charges = 0,
    round_off = 0,

    items,
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: "Invoice items required" });
  }

  if (invoice_type === "credit" && !party_id) {
    return res.status(400).json({ error: "Party required for credit invoice" });
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

  /* ================= INSERT INVOICE ================= */
  db.run(
    `
    INSERT INTO sales_invoices (
      company_id, party_id,
      invoice_no, invoice_date, invoice_type,
      gross_amount, item_discount, invoice_discount,
      taxable_amount, gst_amount,
      extra_charges, round_off,
      total_amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      company_id,
      invoice_type === "credit" ? party_id : null,
      invoice_no,
      invoice_date,
      invoice_type,
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

      /* ========== ITEMS + STOCK ========== */
      items.forEach((item) => {
        db.run(
          `
          INSERT INTO sales_invoice_items (
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

        // reduce stock
        db.run(
          `UPDATE products SET opening_stock = opening_stock - ? WHERE id = ?`,
          [item.qty, item.product_id]
        );
      });

      /* ================= LEDGER POSTING ================= */

      // 1️⃣ Debit Party or Cash
      const debitLedger = invoice_type === "credit" ? party_id : cash_ledger_id;

      db.run(
        `
        INSERT INTO ledger_entries (
          company_id, ledger_id,
          voucher_type, voucher_no, voucher_date,
          debit, credit, narration
        ) VALUES (?, ?, 'sales', ?, ?, ?, 0, ?)
        `,
        [
          company_id,
          debitLedger,
          invoice_no,
          invoice_date,
          total_amount,
          "Sales Invoice",
        ]
      );

      // 2️⃣ Credit Sales
      db.run(
        `
        INSERT INTO ledger_entries (
          company_id, ledger_id,
          voucher_type, voucher_no, voucher_date,
          debit, credit, narration
        ) VALUES (?, ?, 'sales', ?, ?, 0, ?, ?)
        `,
        [
          company_id,
          sales_ledger_id,
          invoice_no,
          invoice_date,
          taxable_amount,
          "Sales Account",
        ]
      );

      // 3️⃣ Credit Output GST
      if (gst_amount > 0) {
        db.run(
          `
          INSERT INTO ledger_entries (
            company_id, ledger_id,
            voucher_type, voucher_no, voucher_date,
            debit, credit, narration
          ) VALUES (?, ?, 'sales', ?, ?, 0, ?, ?)
          `,
          [
            company_id,
            output_gst_ledger_id,
            invoice_no,
            invoice_date,
            gst_amount,
            "Output GST",
          ]
        );
      }

      /* ================= UPDATE LEDGER BALANCES ================= */

      // Debit ledger
      db.run(
        `UPDATE ledgers SET closing_balance = closing_balance + ? WHERE id = ?`,
        [total_amount, debitLedger]
      );

      // Sales ledger
      db.run(
        `UPDATE ledgers SET closing_balance = closing_balance - ? WHERE id = ?`,
        [taxable_amount, sales_ledger_id]
      );

      // GST ledger
      if (gst_amount > 0) {
        db.run(
          `UPDATE ledgers SET closing_balance = closing_balance - ? WHERE id = ?`,
          [gst_amount, output_gst_ledger_id]
        );
      }

      res.json({
        success: true,
        invoice_id: invoiceId,
        invoice_type,
        total_amount,
      });
    }
  );
};

/* =====================================================
   LIST SALES INVOICES
===================================================== */
exports.getSalesInvoices = (req, res) => {
  const { company_id } = req.query;

  db.all(
    `
    SELECT 
      si.*,
      p.name AS party_name
    FROM sales_invoices si
    LEFT JOIN parties p ON p.id = si.party_id
    WHERE si.company_id = ?
    ORDER BY si.invoice_date DESC
    `,
    [company_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

/* =====================================================
   GET SALES INVOICE BY ID (WITH ITEMS)
===================================================== */
exports.getSalesInvoiceById = (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM sales_invoices WHERE id = ?`, [id], (err, invoice) => {
    if (err || !invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    db.all(
      `
        SELECT sii.*, pr.name AS product_name
        FROM sales_invoice_items sii
        JOIN products pr ON pr.id = sii.product_id
        WHERE sii.invoice_id = ?
        `,
      [id],
      (err, items) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          ...invoice,
          items,
        });
      }
    );
  });
};

exports.cancelSalesInvoice = (req, res) => {
  const { id } = req.params;

  // 1️⃣ Fetch invoice
  db.get(`SELECT * FROM sales_invoices WHERE id = ?`, [id], (err, invoice) => {
    if (err || !invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    if (invoice.status === "cancelled") {
      return res.status(400).json({ error: "Invoice already cancelled" });
    }

    // 2️⃣ Restore stock
    db.all(
      `SELECT * FROM sales_invoice_items WHERE invoice_id = ?`,
      [id],
      (err, items) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

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

        // 3️⃣ Reverse party balance ONLY for credit invoice
        if (invoice.invoice_type === "credit") {
          db.run(
            `
              UPDATE parties
              SET closing_balance = closing_balance - ?
              WHERE id = ?
              `,
            [invoice.total_amount, invoice.party_id]
          );
        }

        // 4️⃣ Reverse ledger entries (DO NOT DELETE – TALLY STYLE)
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
              'sales_cancel',
              voucher_no,
              DATE('now'),
              credit,
              debit,
              'Sales Invoice Cancelled'
            FROM ledger_entries
            WHERE voucher_no = ?
              AND voucher_type = 'sales'
            `,
          [invoice.invoice_no]
        );

        // 5️⃣ Mark invoice cancelled
        db.run(
          `
            UPDATE sales_invoices
            SET status = 'cancelled'
            WHERE id = ?
            `,
          [id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.json({
              success: true,
              message: "Sales invoice cancelled successfully",
            });
          }
        );
      }
    );
  });
};
