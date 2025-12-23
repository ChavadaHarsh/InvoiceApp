const db = require("../config/db");

/* CREATE PARTY */
exports.createParty = (req, res) => {
  const {
    company_id,
    name,
    mobile,
    email,
    pan_no,
    gst_no,
    address,
    party_type,
    opening_balance,
    opening_balance_type,
  } = req.body;

  const sql = `
    INSERT INTO parties (
      company_id, name, mobile, email,
      pan_no, gst_no, address,
      party_type,
      opening_balance, opening_balance_type,
      closing_balance
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const closing_balance =
    opening_balance_type === "credit"
      ? -Math.abs(opening_balance)
      : Math.abs(opening_balance);

  db.run(
    sql,
    [
      company_id,
      name,
      mobile,
      email,
      pan_no,
      gst_no,
      address,
      party_type,
      opening_balance,
      opening_balance_type,
      closing_balance,
    ],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
};

/* LIST PARTIES */
exports.getParties = (req, res) => {
  const { company_id, party_type } = req.query;

  let sql = `
    SELECT * FROM parties
    WHERE company_id = ? AND status = 1
  `;
  const params = [company_id];

  if (party_type) {
    sql += " AND party_type = ?";
    params.push(party_type);
  }

  sql += " ORDER BY name";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

/* UPDATE PARTY */
exports.updateParty = (req, res) => {
  const { id } = req.params;
  const { name, mobile, email, pan_no, gst_no, address, party_type, status } =
    req.body;

  db.run(
    `
    UPDATE parties SET
      name = ?, mobile = ?, email = ?,
      pan_no = ?, gst_no = ?, address = ?,
      party_type = ?, status = ?
    WHERE id = ?
    `,
    [name, mobile, email, pan_no, gst_no, address, party_type, status, id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ success: true });
    }
  );
};
