const db = require("../config/db");

/* CREATE PRODUCT */
exports.createProduct = (req, res) => {
  const {
    company_id,
    category_id,
    unit_id,
    name,
    purchase_price,
    sale_price,
    mrp,
    opening_stock,
    low_stock_alert,
  } = req.body;

  // Get GST & HSN from category
  db.get(
    `SELECT hsn_code, gst_rate FROM categories WHERE id = ?`,
    [category_id],
    (err, category) => {
      if (err || !category) {
        return res.status(400).json({ error: "Invalid category" });
      }

      db.run(
        `INSERT INTO products (
          company_id, category_id, unit_id,
          name, hsn_code, gst_rate,
          purchase_price, sale_price, mrp,
          opening_stock, low_stock_alert
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          company_id,
          category_id,
          unit_id,
          name,
          category.hsn_code,
          category.gst_rate,
          purchase_price,
          sale_price,
          mrp,
          opening_stock,
          low_stock_alert,
        ],
        function (err) {
          if (err) return res.status(400).json({ error: err.message });
          res.json({ success: true, id: this.lastID });
        }
      );
    }
  );
};

/* LIST PRODUCTS */
exports.getProducts = (req, res) => {
  const { company_id } = req.query;

  const sql = `
    SELECT p.*, c.name AS category_name, u.code AS unit
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN units u ON p.unit_id = u.id
    WHERE p.company_id = ? AND p.status = 1
    ORDER BY p.name
  `;

  db.all(sql, [company_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};
