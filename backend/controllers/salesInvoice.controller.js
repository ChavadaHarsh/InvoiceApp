const db = require("../config/db");

/* =====================================================
   CREATE SALES INVOICE (CASH / CREDIT)
===================================================== */
exports.createSalesInvoice = (req, res) => {
  const {
    company_id,
    party_id,
    invoice_no,
    invoice_date,
    invoice_type,

    sales_ledger_id,
    output_gst_ledger_id,
    cash_ledger_id,

    invoice_discount = 0,
    extra_charges = 0,
    round_off = 0,
    items,
  } = req.body;

  const fy = req.financial_year;

  if (!items || !items.length) {
    return res.status(400).json({ error: "Invoice items required" });
  }

  if (invoice_type === "credit" && !party_id) {
    return res.status(400).json({ error: "Party required for credit invoice" });
  }

  let gross = 0,
    itemDisc = 0,
    gst = 0;

  items.forEach((i) => {
    gross += Number(i.gross_amount);
    itemDisc += Number(i.discount_amount || 0);
    gst += Number(i.gst_amount);
  });

  const taxable = gross - itemDisc - Number(invoice_discount);
  const total = taxable + gst + Number(extra_charges) + Number(round_off);

  const debitLedger = invoice_type === "credit" ? party_id : cash_ledger_id;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.run(
      `
      INSERT INTO sales_invoices (
        company_id, financial_year_id, party_id,
        invoice_no, invoice_date, invoice_type,
        gross_amount, item_discount, invoice_discount,
        taxable_amount, gst_amount,
        extra_charges, round_off, total_amount,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `,
      [
        company_id,
        fy.id,
        invoice_type === "credit" ? party_id : null,
        invoice_no,
        invoice_date,
        invoice_type,
        gross,
        itemDisc,
        invoice_discount,
        taxable,
        gst,
        extra_charges,
        round_off,
        total,
      ],
      function (err) {
        if (err) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: err.message });
        }

        const invoiceId = this.lastID;

        for (const i of items) {
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
              i.product_id,
              i.qty,
              i.rate,
              i.gross_amount,
              i.discount_percent || 0,
              i.discount_amount || 0,
              i.taxable_amount,
              i.gst_rate,
              i.gst_amount,
              i.total_amount,
            ]
          );

          db.run(
            `UPDATE products SET opening_stock = opening_stock - ? WHERE id = ?`,
            [i.qty, i.product_id]
          );
        }

        // Dr Party / Cash
        db.run(
          `
          INSERT INTO ledger_entries
          (company_id, ledger_id, voucher_type, voucher_no, voucher_date, debit, credit, narration)
          VALUES (?, ?, 'sales', ?, ?, ?, 0, 'Sales Invoice')
          `,
          [company_id, debitLedger, invoice_no, invoice_date, total]
        );

        // Cr Sales
        db.run(
          `
          INSERT INTO ledger_entries
          (company_id, ledger_id, voucher_type, voucher_no, voucher_date, debit, credit, narration)
          VALUES (?, ?, 'sales', ?, ?, 0, ?, 'Sales')
          `,
          [company_id, sales_ledger_id, invoice_no, invoice_date, taxable]
        );

        // Cr Output GST
        if (gst > 0) {
          db.run(
            `
            INSERT INTO ledger_entries
            (company_id, ledger_id, voucher_type, voucher_no, voucher_date, debit, credit, narration)
            VALUES (?, ?, 'sales', ?, ?, 0, ?, 'Output GST')
            `,
            [company_id, output_gst_ledger_id, invoice_no, invoice_date, gst]
          );
        }

        // Ledger balances
        db.run(
          `UPDATE ledgers SET closing_balance = closing_balance + ? WHERE id = ?`,
          [total, debitLedger]
        );
        db.run(
          `UPDATE ledgers SET closing_balance = closing_balance - ? WHERE id = ?`,
          [taxable, sales_ledger_id]
        );
        if (gst > 0) {
          db.run(
            `UPDATE ledgers SET closing_balance = closing_balance - ? WHERE id = ?`,
            [gst, output_gst_ledger_id]
          );
        }

        db.run("COMMIT");
        res.json({ success: true, invoice_id: invoiceId, total_amount: total });
      }
    );
  });
};

/* =====================================================
   LIST SALES INVOICES
===================================================== */
exports.getSalesInvoices = (req, res) => {
  const { company_id } = req.query;

  db.all(
    `
    SELECT si.*, p.name AS party_name
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
   GET SALES INVOICE BY ID
===================================================== */
exports.getSalesInvoiceById = (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM sales_invoices WHERE id = ?`, [id], (err, invoice) => {
    if (err || !invoice)
      return res.status(404).json({ error: "Invoice not found" });

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
        res.json({ ...invoice, items });
      }
    );
  });
};

/* =====================================================
   CANCEL SALES INVOICE
===================================================== */
exports.cancelSalesInvoice = (req, res) => {
  const { id } = req.params;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.get(
      `SELECT * FROM sales_invoices WHERE id = ?`,
      [id],
      (err, invoice) => {
        if (err || !invoice) {
          db.run("ROLLBACK");
          return res.status(404).json({ error: "Invoice not found" });
        }

        if (invoice.status === "cancelled") {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "Already cancelled" });
        }

        db.all(
          `SELECT * FROM sales_invoice_items WHERE invoice_id = ?`,
          [id],
          (err, items) => {
            items.forEach((i) => {
              db.run(
                `UPDATE products SET opening_stock = opening_stock + ? WHERE id = ?`,
                [i.qty, i.product_id]
              );
            });

            db.all(
              `
              SELECT * FROM ledger_entries
              WHERE voucher_no = ?
                AND voucher_type = 'sales'
              `,
              [invoice.invoice_no],
              (err, rows) => {
                rows.forEach((le) => {
                  db.run(
                    `UPDATE ledgers SET closing_balance = closing_balance - ? WHERE id = ?`,
                    [le.debit - le.credit, le.ledger_id]
                  );

                  db.run(
                    `
                    INSERT INTO ledger_entries
                    (company_id, ledger_id, voucher_type, voucher_no, voucher_date, debit, credit, narration)
                    VALUES (?, ?, 'sales_cancel', ?, DATE('now'), ?, ?, 'Sales Cancelled')
                    `,
                    [
                      le.company_id,
                      le.ledger_id,
                      le.voucher_no,
                      le.credit,
                      le.debit,
                    ]
                  );
                });

                db.run(
                  `UPDATE sales_invoices SET status = 'cancelled' WHERE id = ?`,
                  [id],
                  () => {
                    db.run("COMMIT");
                    res.json({ success: true });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
};
