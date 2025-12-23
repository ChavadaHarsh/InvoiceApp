const db = require("../config/db");
db.run(`
CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,

    code TEXT NOT NULL,
    name TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, code),
    FOREIGN KEY (company_id) REFERENCES companies(id)
)
`);
db.run(`
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    unit_id INTEGER NOT NULL,

    name TEXT NOT NULL,
    hsn_code TEXT NOT NULL,
    gst_rate REAL NOT NULL,

    purchase_price REAL NOT NULL,
    sale_price REAL NOT NULL,
    mrp REAL,

    opening_stock REAL DEFAULT 0,
    low_stock_alert REAL DEFAULT 0,

    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (unit_id) REFERENCES units(id)
)
`);
db.run(`
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,

    name TEXT NOT NULL,
    hsn_code TEXT NOT NULL,
    gst_rate REAL NOT NULL DEFAULT 0,

    description TEXT,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(id)
)
`);
db.run(`
INSERT OR IGNORE INTO units (company_id, code, name)
VALUES
(1, 'PCS', 'Pieces'),
(1, 'KG', 'Kilogram'),
(1, 'LTR', 'Litre'),
(1, 'BOX', 'Box'),
(1, 'NOS', 'Numbers')
`);

module.exports = db;
