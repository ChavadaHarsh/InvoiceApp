const db = require("../config/db");

db.run(`

CREATE TABLE IF NOT EXISTS debit_note_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  debit_note_id INTEGER,
  product_id INTEGER,

  qty REAL,
  rate REAL,
    status TEXT DEFAULT 'active',     -- active / partially_returned / returned / cancelled

  taxable_amount REAL,
  gst_rate REAL,
  gst_amount REAL,
  total_amount REAL
);
`);
module.exports = db;
