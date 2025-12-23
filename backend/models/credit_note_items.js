const db = require("../config/db");

db.run(`

CREATE TABLE IF NOT EXISTS credit_note_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_note_id INTEGER,
  product_id INTEGER,

  qty REAL,
  rate REAL,

  taxable_amount REAL,
  gst_rate REAL,
  gst_amount REAL,
  total_amount REAL
);
`);
module.exports = db;
