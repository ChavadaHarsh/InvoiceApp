const db = require("../config/db");

/* ===============================
   LEDGER ENTRIES (VOUCHERS)
================================ */
db.run(`
CREATE TABLE IF NOT EXISTS ledger_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,

    ledger_id INTEGER NOT NULL,
    voucher_type TEXT NOT NULL,
    -- receipt | payment | sales | purchase | credit_note | debit_note

    voucher_id INTEGER,
    voucher_no TEXT,
    voucher_date DATE,

    debit REAL DEFAULT 0,
    credit REAL DEFAULT 0,

    narration TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ledger_id) REFERENCES ledgers(id)
)
`);

module.exports = db;
