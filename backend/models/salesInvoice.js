const db = require("../config/db");

db.run(`
CREATE TABLE IF NOT EXISTS sales_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    company_id INTEGER NOT NULL,
    party_id INTEGER,                 -- NULL allowed for CASH sale

    invoice_no TEXT NOT NULL,
    invoice_date DATE NOT NULL,

    invoice_type TEXT NOT NULL,       -- cash / credit

    gross_amount REAL NOT NULL,
    item_discount REAL DEFAULT 0,
    invoice_discount REAL DEFAULT 0,

    taxable_amount REAL NOT NULL,
    gst_amount REAL NOT NULL,

    extra_charges REAL DEFAULT 0,
    round_off REAL DEFAULT 0,

    total_amount REAL NOT NULL,

    status TEXT DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (company_id, invoice_no)
)
`);

module.exports = db;
