const db = require("../config/db");

/* =====================================================
   CREATE PAYMENT (SUPPLIER / EXPENSE)
===================================================== */
exports.createPayment = (req, res) => {
  const {
    company_id,
    party_ledger_id, // supplier / expense ledger
    cash_bank_ledger_id, // cash or bank ledger

    amount,
    payment_date,
    voucher_no,
    narration,

    settlements = [], // OPTIONAL [{ invoice_id, amount }]
  } = req.body;

  /* ================= VALIDATION ================= */
  if (!company_id || !cash_bank_ledger_id || !party_ledger_id) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid payment amount" });
  }

  const finalNarration = narration || "Payment made";

  /* ===============================
     1️⃣ DEBIT PARTY / EXPENSE
  ================================ */
  db.run(
    `
    INSERT INTO ledger_entries (
      company_id, ledger_id,
      voucher_type, voucher_no, voucher_date,
      debit, credit, narration
    ) VALUES (?, ?, 'payment', ?, ?, ?, 0, ?)
    `,
    [
      company_id,
      party_ledger_id,
      voucher_no,
      payment_date,
      amount,
      finalNarration,
    ]
  );

  /* ===============================
     2️⃣ CREDIT CASH / BANK
  ================================ */
  db.run(
    `
    INSERT INTO ledger_entries (
      company_id, ledger_id,
      voucher_type, voucher_no, voucher_date,
      debit, credit, narration
    ) VALUES (?, ?, 'payment', ?, ?, 0, ?, ?)
    `,
    [
      company_id,
      cash_bank_ledger_id,
      voucher_no,
      payment_date,
      amount,
      finalNarration,
    ]
  );

  /* ===============================
     3️⃣ UPDATE LEDGER BALANCES
  ================================ */

  // Supplier / Expense ledger increases (debit)
  db.run(
    `
    UPDATE ledgers
    SET closing_balance = closing_balance + ?
    WHERE id = ?
    `,
    [amount, party_ledger_id]
  );

  // Cash / Bank decreases
  db.run(
    `
    UPDATE ledgers
    SET closing_balance = closing_balance - ?
    WHERE id = ?
    `,
    [amount, cash_bank_ledger_id]
  );

  /* ===============================
     4️⃣ INVOICE SETTLEMENT (OPTIONAL)
     (For Purchase Bills)
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
      ) VALUES (?, 'purchase', ?, 'payment', ?, ?, ?)
      `,
      [company_id, s.invoice_id, voucher_no, s.amount, payment_date]
    );
  });

  res.json({
    success: true,
    message: "Payment posted successfully",
  });
};
