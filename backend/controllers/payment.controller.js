const db = require("../config/db");

/* =====================================================
   CREATE PAYMENT (SUPPLIER PAYMENT)
===================================================== */
exports.createPayment = (req, res) => {
  const {
    company_id,
    party_ledger_id,
    cash_bank_ledger_id,
    amount,
    payment_date,
    voucher_no,
    narration,
  } = req.body;

  if (!company_id || !party_ledger_id || !cash_bank_ledger_id) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid payment amount" });
  }

  const note = narration || "Payment made";

  // Dr Party
  db.run(
    `
    INSERT INTO ledger_entries
    (company_id, ledger_id, voucher_type, voucher_no, voucher_date, debit, credit, narration)
    VALUES (?, ?, 'payment', ?, ?, ?, 0, ?)
    `,
    [company_id, party_ledger_id, voucher_no, payment_date, amount, note]
  );

  // Cr Cash / Bank
  db.run(
    `
    INSERT INTO ledger_entries
    (company_id, ledger_id, voucher_type, voucher_no, voucher_date, debit, credit, narration)
    VALUES (?, ?, 'payment', ?, ?, 0, ?, ?)
    `,
    [company_id, cash_bank_ledger_id, voucher_no, payment_date, amount, note]
  );

  res.json({ success: true });
};

/* =====================================================
   LIST PAYMENTS ✅ FIXED
===================================================== */
exports.getPayments = (req, res) => {
  const { company_id } = req.query;

  db.all(
    `
    SELECT *
    FROM ledger_entries
    WHERE company_id = ?
      AND voucher_type = 'payment'
    ORDER BY voucher_date DESC
    `,
    [company_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

/* =====================================================
   GET PAYMENT BY ID ✅ FIXED
===================================================== */
exports.getPaymentById = (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM ledger_entries WHERE id = ?`, [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json(row);
  });
};

/* =====================================================
   CANCEL PAYMENT ✅ FIXED
===================================================== */
exports.cancelPayment = (req, res) => {
  const { id } = req.params;

  db.run(
    `
    UPDATE ledger_entries
    SET narration = narration || ' (Cancelled)'
    WHERE id = ?
    `,
    [id],
    () => res.json({ success: true })
  );
};
