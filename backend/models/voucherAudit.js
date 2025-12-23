const db = require("../config/db");

/* ==================================
   VOUCHER AUDIT (EDIT HISTORY)
================================== */
db.run(`
CREATE TABLE IF NOT EXISTS voucher_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  company_id INTEGER NOT NULL,

  voucher_type TEXT NOT NULL,     -- sales, purchase, receipt, payment, credit_note, debit_note
  voucher_id INTEGER NOT NULL,    -- original voucher table id
  voucher_no TEXT NOT NULL,

  old_data TEXT NOT NULL,         -- JSON string before edit
  new_data TEXT NOT NULL,         -- JSON string after edit

  edited_by INTEGER NOT NULL,     -- user.id
  edited_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

module.exports = db;
