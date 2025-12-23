const db = require("../config/db");

exports.closeFinancialYear = (req, res) => {
  const { company_id, from_fy_id, to_fy_id } = req.body;

  // 1️⃣ Carry forward assets & liabilities
  db.run(
    `
    UPDATE ledgers
    SET opening_balance = closing_balance
    WHERE company_id = ?
      AND ledger_type IN ('asset','liability','capital','bank','cash')
  `,
    [company_id]
  );

  // 2️⃣ Reset income & expense
  db.run(
    `
    UPDATE ledgers
    SET opening_balance = 0,
        closing_balance = 0
    WHERE company_id = ?
      AND ledger_type IN ('income','expense')
  `,
    [company_id]
  );

  // 3️⃣ Lock old FY
  db.run(
    `
    UPDATE financial_years
    SET is_locked = 1
    WHERE id = ?
  `,
    [from_fy_id]
  );

  res.json({ success: true, message: "Year closed successfully" });
};
