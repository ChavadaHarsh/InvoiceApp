const db = require("../config/db");

/* =====================================================
   CREATE PURCHASE BILL (CASH / CREDIT)
===================================================== */
exports.createPurchaseInvoice = (req, res) => {
  const {
    company_id,
    party_id,
    invoice_no,
    invoice_date,
    purchase_type,

    purchase_ledger_id,
    input_gst_ledger_id,
    cash_ledger_id,

    invoice_discount = 0,
    extra_charges = 0,
    round_off = 0,
    items,
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: "Purchase items required" });
  }

  if (purchase_type === "credit" && !party_id) {
    return res.status(400).json({ error: "Supplier required" });
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

  const creditLedger = purchase_type === "credit" ? party_id : cash_ledger_id;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.run(
      `
      INSERT INTO purchase_invoices (
        company_id, party_id,
        invoice_no, invoice_date, purchase_type,
        gross_amount, item_discount, invoice_discount,
        taxable_amount, gst_amount,
        extra_charges, round_off,
        total_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `,
      [
        company_id,
        purchase_type === "credit" ? party_id : null,
        invoice_no,
        invoice_date,
        purchase_type,
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
            `UPDATE products SET opening_stock = opening_stock + ? WHERE id = ?`,
            [i.qty, i.product_id]
          );
        }

        // Dr Purchase
        db.run(
          `
          INSERT INTO ledger_entries
          (company_id, ledger_id, voucher_type, voucher_no, voucher_date, debit, credit, narration)
          VALUES (?, ?, 'purchase', ?, ?, ?, 0, 'Purchase')
          `,
          [company_id, purchase_ledger_id, invoice_no, invoice_date, taxable]
        );

        // Dr Input GST
        if (gst > 0) {
          db.run(
            `
            INSERT INTO ledger_entries
            (company_id, ledger_id, voucher_type, voucher_no, voucher_date, debit, credit, narration)
            VALUES (?, ?, 'purchase', ?, ?, ?, 0, 'Input GST')
            `,
            [company_id, input_gst_ledger_id, invoice_no, invoice_date, gst]
          );
        }

        // Cr Supplier / Cash
        db.run(
          `
          INSERT INTO ledger_entries
          (company_id, ledger_id, voucher_type, voucher_no, voucher_date, debit, credit, narration)
          VALUES (?, ?, 'purchase', ?, ?, 0, ?, 'Purchase Bill')
          `,
          [company_id, creditLedger, invoice_no, invoice_date, total]
        );

        // Ledger balances
        db.run(
          `UPDATE ledgers SET closing_balance = closing_balance + ? WHERE id = ?`,
          [taxable, purchase_ledger_id]
        );

        if (gst > 0) {
          db.run(
            `UPDATE ledgers SET closing_balance = closing_balance + ? WHERE id = ?`,
            [gst, input_gst_ledger_id]
          );
        }

        db.run(
          `UPDATE ledgers SET closing_balance = closing_balance - ? WHERE id = ?`,
          [total, creditLedger]
        );

        db.run("COMMIT");
        res.json({ success: true, purchase_invoice_id: invoiceId });
      }
    );
  });
};

/* =====================================================
   LIST PURCHASE INVOICES  ✅ (FIXED)
===================================================== */
exports.getPurchaseInvoices = (req, res) => {
  const { company_id } = req.query;

  db.all(
    `
    SELECT pi.*, p.name AS supplier_name
    FROM purchase_invoices pi
    LEFT JOIN parties p ON p.id = pi.party_id
    WHERE pi.company_id = ?
    ORDER BY pi.invoice_date DESC
    `,
    [company_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

/* =====================================================
   GET PURCHASE INVOICE BY ID  ✅ (FIXED)
===================================================== */
exports.getPurchaseInvoiceById = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT * FROM purchase_invoices WHERE id = ?`,
    [id],
    (err, invoice) => {
      if (err || !invoice) return res.status(404).json({ error: "Not found" });

      db.all(
        `
        SELECT pii.*, pr.name AS product_name
        FROM purchase_invoice_items pii
        JOIN products pr ON pr.id = pii.product_id
        WHERE pii.invoice_id = ?
        `,
        [id],
        (err, items) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ ...invoice, items });
        }
      );
    }
  );
};

/* =====================================================
   CANCEL PURCHASE INVOICE
===================================================== */
exports.cancelPurchaseInvoice = (req, res) => {
  const { id } = req.params;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.get(
      `SELECT * FROM purchase_invoices WHERE id = ?`,
      [id],
      (err, invoice) => {
        if (err || !invoice) {
          db.run("ROLLBACK");
          return res.status(404).json({ error: "Not found" });
        }

        if (invoice.status === "cancelled") {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "Already cancelled" });
        }

        db.all(
          `SELECT * FROM purchase_invoice_items WHERE invoice_id = ?`,
          [id],
          (err, items) => {
            items.forEach((i) => {
              db.run(
                `UPDATE products SET opening_stock = opening_stock - ? WHERE id = ?`,
                [i.qty, i.product_id]
              );
            });

            db.all(
              `
              SELECT * FROM ledger_entries
              WHERE voucher_no = ?
                AND voucher_type = 'purchase'
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
                    VALUES (?, ?, 'purchase_cancel', ?, DATE('now'), ?, ?, 'Purchase Cancelled')
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
                  `UPDATE purchase_invoices SET status = 'cancelled' WHERE id = ?`,
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
