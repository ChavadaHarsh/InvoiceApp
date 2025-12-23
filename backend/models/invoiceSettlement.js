const db = require("../config/db");

db.run(`
CREATE TABLE IF NOT EXISTS invoice_settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    company_id INTEGER NOT NULL,
    invoice_type TEXT NOT NULL, -- sales / purchase
    invoice_id INTEGER NOT NULL,

    voucher_type TEXT NOT NULL, -- receipt / payment
    voucher_id INTEGER,

    amount REAL NOT NULL,
    settlement_date DATE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);
module.exports = db;
