const db = require("../config/db");

/* =====================================================
   BALANCE SHEET (TALLY STYLE)
===================================================== */
exports.getBalanceSheet = (req, res) => {
  const { company_id } = req.query;

  if (!company_id) {
    return res.status(400).json({ error: "company_id required" });
  }

  /* ===============================
     ASSETS
  ================================ */
  const assetsQuery = `
    SELECT
      id,
      name,
      closing_balance AS amount
    FROM ledgers
    WHERE company_id = ?
      AND ledger_type IN ('asset', 'bank', 'cash')
      AND closing_balance > 0
  `;

  /* ===============================
     LIABILITIES
  ================================ */
  const liabilitiesQuery = `
    SELECT
      id,
      name,
      ABS(closing_balance) AS amount
    FROM ledgers
    WHERE company_id = ?
      AND ledger_type IN ('liability', 'capital')
      AND closing_balance < 0
  `;

  /* ===============================
     PROFIT / LOSS
  ================================ */
  const pnlQuery = `
    SELECT
      SUM(
        CASE
          WHEN l.ledger_type = 'income' THEN le.credit - le.debit
          WHEN l.ledger_type = 'expense' THEN le.debit - le.credit
          ELSE 0
        END
      ) AS net_profit
    FROM ledger_entries le
    JOIN ledgers l ON l.id = le.ledger_id
    WHERE l.company_id = ?
  `;

  db.all(assetsQuery, [company_id], (err, assets) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all(liabilitiesQuery, [company_id], (err, liabilities) => {
      if (err) return res.status(500).json({ error: err.message });

      db.get(pnlQuery, [company_id], (err, pnl) => {
        if (err) return res.status(500).json({ error: err.message });

        const profit = Number(pnl.net_profit || 0);

        if (profit !== 0) {
          liabilities.push({
            id: "PNL",
            name: profit >= 0 ? "Net Profit" : "Net Loss",
            amount: Math.abs(profit),
          });
        }

        const totalAssets = assets.reduce((s, a) => s + a.amount, 0);
        const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0);

        res.json({
          company_id,
          assets,
          liabilities,
          summary: {
            total_assets: totalAssets,
            total_liabilities: totalLiabilities,
            difference: totalAssets - totalLiabilities,
          },
        });
      });
    });
  });
};
