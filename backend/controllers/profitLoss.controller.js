const db = require("../config/db");

/* =====================================================
   PROFIT & LOSS REPORT (TALLY STYLE)
===================================================== */
exports.getProfitLoss = (req, res) => {
  const { company_id, from_date, to_date } = req.query;

  if (!company_id) {
    return res.status(400).json({ error: "company_id required" });
  }

  const dateFilter =
    from_date && to_date
      ? `AND le.voucher_date BETWEEN '${from_date}' AND '${to_date}'`
      : "";

  /* ===============================
     INCOME LEDGERS
  ================================ */
  const incomeQuery = `
    SELECT
      l.id,
      l.name,
      SUM(le.credit - le.debit) AS amount
    FROM ledger_entries le
    JOIN ledgers l ON l.id = le.ledger_id
    WHERE l.company_id = ?
      AND l.ledger_type = 'income'
      ${dateFilter}
    GROUP BY l.id
    HAVING amount != 0
  `;

  /* ===============================
     EXPENSE LEDGERS
  ================================ */
  const expenseQuery = `
    SELECT
      l.id,
      l.name,
      SUM(le.debit - le.credit) AS amount
    FROM ledger_entries le
    JOIN ledgers l ON l.id = le.ledger_id
    WHERE l.company_id = ?
      AND l.ledger_type = 'expense'
      ${dateFilter}
    GROUP BY l.id
    HAVING amount != 0
  `;

  db.all(incomeQuery, [company_id], (err, incomes) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all(expenseQuery, [company_id], (err, expenses) => {
      if (err) return res.status(500).json({ error: err.message });

      const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);

      const totalExpense = expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );

      const netProfit = totalIncome - totalExpense;

      res.json({
        company_id,
        period: {
          from: from_date || null,
          to: to_date || null,
        },
        income: incomes,
        expense: expenses,
        summary: {
          total_income: totalIncome,
          total_expense: totalExpense,
          net_profit: netProfit,
          result: netProfit >= 0 ? "Profit" : "Loss",
        },
      });
    });
  });
};
