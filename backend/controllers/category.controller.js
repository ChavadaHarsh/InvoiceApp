const db = require("../config/db");

/* CREATE CATEGORY */
exports.createCategory = (req, res) => {
  const { company_id, name, hsn_code, gst_rate, description } = req.body;

  const sql = `
    INSERT INTO categories (company_id, name, hsn_code, gst_rate, description)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [company_id, name, hsn_code, gst_rate, description],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
};

/* LIST CATEGORIES */
exports.getCategories = (req, res) => {
  const { company_id } = req.query;

  db.all(
    `SELECT * FROM categories WHERE company_id = ? AND status = 1 ORDER BY name`,
    [company_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

/* UPDATE CATEGORY */
exports.updateCategory = (req, res) => {
  const { id } = req.params;
  const { name, hsn_code, gst_rate, description, status } = req.body;

  db.run(
    `UPDATE categories SET
      name = ?, hsn_code = ?, gst_rate = ?, description = ?, status = ?
     WHERE id = ?`,
    [name, hsn_code, gst_rate, description, status, id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ success: true });
    }
  );
};
