const db = require("../config/db");

db.run(`

CREATE TABLE IF NOT EXISTS credit_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  party_id INTEGER,
  invoice_id INTEGER,

  credit_note_no TEXT,
  credit_note_date DATE,

  taxable_amount REAL,
  gst_amount REAL,
  total_amount REAL,
financial_year_id INTEGER,
  reason TEXT,
      status TEXT DEFAULT 'active',     -- active / partially_returned / returned / cancelled

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
module.exports = db;
