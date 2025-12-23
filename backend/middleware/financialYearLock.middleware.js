const { getFinancialYearByDate } = require("../helpers/financialYear.helper");

module.exports = function checkFinancialYearLock(req, res, next) {
  const { company_id } = req.body;
  const date =
    req.body.invoice_date ||
    req.body.payment_date ||
    req.body.receipt_date ||
    req.body.credit_note_date ||
    req.body.debit_note_date;

  if (!company_id || !date) {
    return res.status(400).json({ error: "company_id and date required" });
  }

  getFinancialYearByDate(company_id, date, (err, fy) => {
    if (err || !fy) {
      return res.status(400).json({ error: "Financial year not found" });
    }

    if (fy.is_locked) {
      return res.status(403).json({
        error: `Financial Year ${fy.year_name} is locked`,
      });
    }

    // Attach FY for controller use
    req.financial_year = fy;
    next();
  });
};
