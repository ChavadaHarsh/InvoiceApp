const db = require("../config/db");

db.run(`
CREATE TABLE IF NOT EXISTS parties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,

    name TEXT NOT NULL,
    mobile TEXT,
    email TEXT,

    pan_no TEXT,
    gst_no TEXT,

    address TEXT,

    party_type TEXT NOT NULL, -- customer / supplier / both

    opening_balance REAL DEFAULT 0,
    opening_balance_type TEXT DEFAULT 'debit', -- debit / credit

    closing_balance REAL DEFAULT 0,

    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(id)
)
`);

module.exports = db;
