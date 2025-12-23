const db = require("../config/db");

/* =====================================================
   CREATE RECEIPT (CUSTOMER PAYMENT)
===================================================== */
exports.createReceipt = (req, res) => {
  const {
    company_id,
    party_ledger_id,
    cash_bank_ledger_id,

    amount,
    receipt_date,
    voucher_no,
    narration,

    settlements = [], // OPTIONAL [{ invoice_id, amount }]
  } = req.body;

  if (!company_id || !party_ledger_id || !cash_bank_ledger_id) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid receipt amount" });
  }

  const finalNarration = narration || "Receipt received";

  /* ===============================
     1️⃣ DEBIT CASH / BANK
  ================================ */
  db.run(
    `
    INSERT INTO ledger_entries (
      company_id, ledger_id,
      voucher_type, voucher_no, voucher_date,
      debit, credit, narration
    ) VALUES (?, ?, 'receipt', ?, ?, ?, 0, ?)
    `,
    [
      company_id,
      cash_bank_ledger_id,
      voucher_no,
      receipt_date,
      amount,
      finalNarration,
    ]
  );

  /* ===============================
     2️⃣ CREDIT PARTY
  ================================ */
  db.run(
    `
    INSERT INTO ledger_entries (
      company_id, ledger_id,
      voucher_type, voucher_no, voucher_date,
      debit, credit, narration
    ) VALUES (?, ?, 'receipt', ?, ?, 0, ?, ?)
    `,
    [
      company_id,
      party_ledger_id,
      voucher_no,
      receipt_date,
      amount,
      finalNarration,
    ]
  );

  /* ===============================
     3️⃣ UPDATE LEDGER BALANCES
  ================================ */
  // Cash / Bank increases
  db.run(
    `
    UPDATE ledgers
    SET closing_balance = closing_balance + ?
    WHERE id = ?
    `,
    [amount, cash_bank_ledger_id]
  );

  // Party outstanding reduces
  db.run(
    `
    UPDATE ledgers
    SET closing_balance = closing_balance - ?
    WHERE id = ?
    `,
    [amount, party_ledger_id]
  );

  /* ===============================
     4️⃣ INVOICE SETTLEMENT (OPTIONAL)
  ================================ */
  settlements.forEach((s) => {
    db.run(
      `
      INSERT INTO invoice_settlements (
        company_id,
        invoice_type,
        invoice_id,
        voucher_type,
        voucher_no,
        amount,
        settlement_date
      ) VALUES (?, 'sales', ?, 'receipt', ?, ?, ?)
      `,
      [company_id, s.invoice_id, voucher_no, s.amount, receipt_date]
    );
  });

  res.json({
    success: true,
    message: "Receipt posted successfully",
  });
};
