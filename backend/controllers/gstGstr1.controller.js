const db = require("../config/db");

/* =====================================================
   GSTR-1 (SALES)
===================================================== */
exports.getGstr1 = (req, res) => {
  const { company_id, from_date, to_date } = req.query;

  const dateFilter =
    from_date && to_date
      ? `AND si.invoice_date BETWEEN '${from_date}' AND '${to_date}'`
      : "";

  db.all(
    `
    SELECT
      si.invoice_no,
      si.invoice_date,
      p.name AS party_name,
      p.gstin,
      si.taxable_amount,
      si.gst_amount,
      si.total_amount
    FROM sales_invoices si
    LEFT JOIN parties p ON p.id = si.party_id
    WHERE si.company_id = ?
      AND si.status = 'active'
      ${dateFilter}
    ORDER BY si.invoice_date
    `,
    [company_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const summary = {
        taxable: rows.reduce((s, r) => s + r.taxable_amount, 0),
        gst: rows.reduce((s, r) => s + r.gst_amount, 0),
        total: rows.reduce((s, r) => s + r.total_amount, 0),
      };

      res.json({
        company_id,
        period: { from: from_date, to: to_date },
        invoices: rows,
        summary,
      });
    }
  );
};
