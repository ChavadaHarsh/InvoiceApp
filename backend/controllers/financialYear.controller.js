const db = require("../config/db");

/* =====================================================
   LIST FINANCIAL YEARS  ✅ FIXED
===================================================== */
exports.getFinancialYears = (req, res) => {
  db.all(
    `
    SELECT *
    FROM financial_years
    ORDER BY start_date DESC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
};

/* =====================================================
   LOCK FINANCIAL YEAR
===================================================== */
exports.lockFinancialYear = (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Financial year id required" });
  }

  db.run(
    `
    UPDATE financial_years
    SET is_locked = 1
    WHERE id = ?
    `,
    [id],
    () => {
      res.json({ success: true, message: "Financial year locked" });
    }
  );
};

/* =====================================================
   UNLOCK FINANCIAL YEAR
===================================================== */
exports.unlockFinancialYear = (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Financial year id required" });
  }

  db.run(
    `
    UPDATE financial_years
    SET is_locked = 0
    WHERE id = ?
    `,
    [id],
    () => {
      res.json({ success: true, message: "Financial year unlocked" });
    }
  );
};
