const db = require("../models/User");

exports.createCompany = (req, res) => {
  const { name, gstin, address } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Company name is required",
    });
  }

  db.run(
    `
    INSERT INTO companies (user_id, name, gstin, address)
    VALUES (?, ?, ?, ?)
    `,
    [userId, name, gstin, address],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Company creation failed",
        });
      }

      res.json({
        success: true,
        company: {
          id: this.lastID,
          name,
          gstin,
          address,
        },
      });
    }
  );
};

exports.getCompanies = (req, res) => {
  const userId = req.user.id;

  db.all(
    `
    SELECT id, name, gstin, address
    FROM companies
    WHERE user_id = ?
    ORDER BY id DESC
    `,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch companies",
        });
      }

      res.json({
        success: true,
        companies: rows,
      });
    }
  );
};
exports.switchCompany = (req, res) => {
  const userId = req.user.id;

  db.run(
    `
    UPDATE users
    SET active_company_id = NULL
    WHERE id = ?
    `,
    [userId],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to switch company",
        });
      }

      res.json({
        success: true,
      });
    }
  );
};

exports.selectCompany = (req, res) => {
  const userId = req.user.id;
  const { company_id } = req.body;

  if (!company_id) {
    return res.status(400).json({
      success: false,
      message: "Company id is required",
    });
  }

  db.run(
    `
    UPDATE users
    SET active_company_id = ?
    WHERE id = ?
    `,
    [company_id, userId],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to select company",
        });
      }

      res.json({
        success: true,
        active_company_id: company_id,
      });
    }
  );
};
exports.getActiveCompany = (req, res) => {
  const userId = req.user.id;

  db.get(
    `
    SELECT c.*
    FROM companies c
    JOIN users u ON u.active_company_id = c.id
    WHERE u.id = ?
    `,
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch active company",
        });
      }

      res.json({
        success: true,
        company: row || null,
      });
    }
  );
};
