const db = require("../config/db");

db.run(`

CREATE TABLE IF NOT EXISTS debit_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  party_id INTEGER,
  invoice_id INTEGER,

  debit_note_no TEXT,
  debit_note_date DATE,

  taxable_amount REAL,
  gst_amount REAL,
  total_amount REAL,
financial_year_id INTEGER,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);
module.exports = db;
