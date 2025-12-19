const db = require("../models/User");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");
const crypto = require("crypto");
/**
 * Get client IP address
 */
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    req.ip
  );
};

/**
 * REGISTER USER
 */
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1️⃣ Check if email already exists
    db.get(
      `SELECT id FROM users WHERE email = ?`,
      [email],
      async (err, existingUser) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Database error",
          });
        }

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "Email already exists",
          });
        }

        // 2️⃣ Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3️⃣ Insert new user
        db.run(
          `
                    INSERT INTO users (name, email, password, status)
                    VALUES (?, ?, ?, 'offline')
                    `,
          [name, email, hashedPassword],
          function (err) {
            if (err) {
              return res.status(500).json({
                success: false,
                message: "Failed to register user",
              });
            }

            return res.status(201).json({
              success: true,
              message: "User registered successfully",
              user: {
                id: this.lastID,
                name,
                email,
                status: "offline",
              },
            });
          }
        );
      }
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * LOGIN USER
 */
exports.login = (req, res) => {
  const { email, password } = req.body;
  const ipAddress = getClientIp(req);

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 1️⃣ Update login status + IP
    db.run(
      `
                UPDATE users
                SET status = 'online',
                    last_login_ip = ?,
                    last_login_at = CURRENT_TIMESTAMP
                WHERE id = ?
                `,
      [ipAddress, user.id]
    );

    // 2️⃣ Generate token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: "online",
        last_login_ip: ipAddress,
      },
    });
  });
};

/**
 * LOGOUT USER
 */
exports.logout = (req, res) => {
  const userId = req.user.id;

  db.run(
    `UPDATE users SET status = 'offline' WHERE id = ?`,
    [userId],
    (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Logout failed",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    }
  );
};

/**
 * FORGOT PASSWORD
 */

exports.forgotPassword = async (req, res) => {
  const { email, new_password } = req.body;

  // Validation
  if (!email || !new_password) {
    return res.status(400).json({
      success: false,
      message: "Email and new password are required",
    });
  }

  try {
    // Check user
    db.get(
      `SELECT id FROM users WHERE email = ?`,
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Database error",
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "Email not found",
          });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update password
        db.run(
          `UPDATE users SET password = ? WHERE id = ?`,
          [hashedPassword, user.id],
          function (updateErr) {
            if (updateErr) {
              return res.status(500).json({
                success: false,
                message: "Failed to update password",
              });
            }

            return res.json({
              success: true,
              message: "Password updated successfully",
            });
          }
        );
      }
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

/**
 * RESET PASSWORD
 */
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  db.get(
    `
        SELECT id FROM users
        WHERE reset_token = ?
        AND reset_token_expiry > CURRENT_TIMESTAMP
        `,
    [token],
    async (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired token",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(
        `
                UPDATE users
                SET password = ?,
                    reset_token = NULL,
                    reset_token_expiry = NULL
                WHERE id = ?
                `,
        [hashedPassword, user.id]
      );

      return res.json({
        success: true,
        message: "Password reset successful",
      });
    }
  );
};
