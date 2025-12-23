const db = require("../config/db");

/* ==================================
   FINANCIAL YEARS
================================== */
db.run(`
CREATE TABLE IF NOT EXISTS financial_years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,

    year_name TEXT NOT NULL,        -- e.g. 2024-25
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    is_locked INTEGER DEFAULT 0,    -- 0 = open, 1 = locked
    locked_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (company_id, year_name)
)
`);

module.exports = db;
