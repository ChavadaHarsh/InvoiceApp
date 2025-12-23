const db = require("../config/db");

/* ===============================
   CREATE RECEIPT
================================ */
exports.createReceipt = (req, res) => {
  const {
    company_id,
    party_ledger_id,
    cash_bank_ledger_id,
    amount,
    receipt_date,
    voucher_no,
    narration,
    settlements = [],
  } = req.body;

  if (!company_id || !party_ledger_id || !cash_bank_ledger_id) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  db.run(
    `
    INSERT INTO ledger_entries
    (company_id, ledger_id, voucher_type, voucher_no, voucher_date, debit, credit, narration)
    VALUES (?, ?, 'receipt', ?, ?, ?, 0, ?)
    `,
    [
      company_id,
      cash_bank_ledger_id,
      voucher_no,
      receipt_date,
      amount,
      narration,
    ]
  );

  db.run(
    `
    INSERT INTO ledger_entries
    (company_id, ledger_id, voucher_type, voucher_no, voucher_date, debit, credit, narration)
    VALUES (?, ?, 'receipt', ?, ?, 0, ?, ?)
    `,
    [company_id, party_ledger_id, voucher_no, receipt_date, amount, narration]
  );

  res.json({ success: true });
};

/* ===============================
   LIST RECEIPTS  ✅ FIXED
================================ */
exports.getReceipts = (req, res) => {
  const { company_id } = req.query;

  db.all(
    `
    SELECT *
    FROM ledger_entries
    WHERE company_id = ?
      AND voucher_type = 'receipt'
    ORDER BY voucher_date DESC
    `,
    [company_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

/* ===============================
   GET RECEIPT BY ID  ✅ FIXED
================================ */
exports.getReceiptById = (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM ledger_entries WHERE id = ?`, [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: "Receipt not found" });
    }
    res.json(row);
  });
};

/* ===============================
   CANCEL RECEIPT  ✅ FIXED
================================ */
exports.cancelReceipt = (req, res) => {
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
