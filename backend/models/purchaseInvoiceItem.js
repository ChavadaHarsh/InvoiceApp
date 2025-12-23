const db = require("../config/db");

/* ==================================
   PURCHASE INVOICE ITEMS
================================== */
db.run(`
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    invoice_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,

    qty REAL NOT NULL,
    rate REAL NOT NULL,

    gross_amount REAL NOT NULL,

    discount_percent REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,

    taxable_amount REAL NOT NULL,

    gst_rate REAL NOT NULL,
    gst_amount REAL NOT NULL,

    total_amount REAL NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
)
`);

module.exports = db;
