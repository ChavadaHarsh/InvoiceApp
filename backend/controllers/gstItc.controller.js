const db = require("../config/db");

/* =====================================================
   INPUT TAX CREDIT (ITC) REPORT – PURCHASE GST
===================================================== */
exports.getItc = (req, res) => {
  const { company_id, from_date, to_date } = req.query;

  if (!company_id) {
    return res.status(400).json({ error: "company_id required" });
  }

  const dateFilter =
    from_date && to_date
      ? `AND pi.invoice_date BETWEEN '${from_date}' AND '${to_date}'`
      : "";

  db.all(
    `
    SELECT
      pi.id AS purchase_invoice_id,
      pi.invoice_no,
      pi.invoice_date,

      p.name AS supplier_name,
      p.gstin AS supplier_gstin,

      pi.taxable_amount,
      pi.gst_amount,
      pi.total_amount
    FROM purchase_invoices pi
    LEFT JOIN parties p ON p.id = pi.party_id
    WHERE pi.company_id = ?
      AND pi.status = 'active'
      ${dateFilter}
    ORDER BY pi.invoice_date
    `,
    [company_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const summary = {
        taxable_amount: rows.reduce((s, r) => s + Number(r.taxable_amount), 0),
        gst_amount: rows.reduce((s, r) => s + Number(r.gst_amount), 0),
        total_amount: rows.reduce((s, r) => s + Number(r.total_amount), 0),
      };

      res.json({
        company_id,
        period: {
          from: from_date || null,
          to: to_date || null,
        },
        purchases: rows,
        summary,
      });
    }
  );
};
