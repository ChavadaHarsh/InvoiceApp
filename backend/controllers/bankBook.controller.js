const db = require("../config/db");

/* =====================================================
   BANK BOOK
===================================================== */
exports.getBankBook = (req, res) => {
  const { company_id, bank_ledger_id, from_date, to_date } = req.query;

  if (!company_id || !bank_ledger_id) {
    return res
      .status(400)
      .json({ error: "company_id & bank_ledger_id required" });
  }

  const dateFilter =
    from_date && to_date
      ? `AND le.voucher_date BETWEEN '${from_date}' AND '${to_date}'`
      : "";

  db.all(
    `
    SELECT
      le.voucher_date,
      le.voucher_type,
      le.voucher_no,
      l.name AS bank_name,
      le.debit,
      le.credit,
      le.narration
    FROM ledger_entries le
    JOIN ledgers l ON l.id = le.ledger_id
    WHERE le.company_id = ?
      AND le.ledger_id = ?
      ${dateFilter}
    ORDER BY le.voucher_date, le.id
    `,
    [company_id, bank_ledger_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
      const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

      res.json({
        company_id,
        bank_ledger_id,
        period: { from: from_date || null, to: to_date || null },
        entries: rows,
        summary: {
          total_deposit: totalDebit,
          total_withdrawal: totalCredit,
          closing_balance: totalDebit - totalCredit,
        },
      });
    }
  );
};
