const db = require("../config/db");

/* CREATE UNIT */
exports.createUnit = (req, res) => {
  const { company_id, code, name } = req.body;

  db.run(
    `INSERT INTO units (company_id, code, name) VALUES (?, ?, ?)`,
    [company_id, code, name],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
};

/* LIST UNITS */
exports.getUnits = (req, res) => {
  const { company_id } = req.query;

  db.all(
    `SELECT * FROM units WHERE company_id = ? ORDER BY name`,
    [company_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};
