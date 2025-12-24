const express = require("express");
const cors = require("cors");

const app = express();

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors());
app.use(express.json());

/* ===============================
   AUTH & MASTER ROUTES
================================ */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/companies", require("./routes/company.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/units", require("./routes/unit.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/parties", require("./routes/party.routes"));

/* ===============================
   VOUCHER ROUTES
================================ */
app.use("/api/sales-invoices", require("./routes/salesInvoice.routes"));
app.use("/api/purchase-invoices", require("./routes/purchaseInvoice.routes"));
app.use("/api/credit-notes", require("./routes/creditNote.routes"));
app.use("/api/debit-notes", require("./routes/debitNote.routes"));
app.use("/api/receipts", require("./routes/receipt.routes"));
app.use("/api/payments", require("./routes/payment.routes"));

/* ===============================
   FINANCIAL YEAR ROUTES
================================ */
// 👉 Keep ONLY ONE (recommended outside reports)
app.use("/api/financial-years", require("./routes/financialYear.routes"));

/* ===============================
   REPORT ROUTES
================================ */
app.use(
  "/api/reports/balance-sheet",
  require("./routes/reports/balanceSheet.routes")
);
app.use("/api/financial-years", require("./routes/financialYear.routes"));

app.use(
  "/api/reports/profit-loss",
  require("./routes/reports/profitLoss.routes")
);
app.use("/api/reports/day-book", require("./routes/reports/dayBook.routes"));
app.use("/api/reports/cash-book", require("./routes/reports/cashBook.routes"));
app.use("/api/reports/bank-book", require("./routes/reports/bankBook.routes"));
app.use("/api/reports/gstr1", require("./routes/reports/gstGstr1.routes"));
app.use("/api/reports/itc", require("./routes/reports/gstItc.routes"));

/* ===============================
   SERVER START

================================ */
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
