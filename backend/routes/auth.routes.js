const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");

const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../validations/auth.validation");

const validate = require("../middleware/validate.middleware");
const authMiddleware = require("../middleware/auth.middleware");

// Register
router.post("/register", registerValidation, validate, register);

// Login
router.post("/login", loginValidation, validate, login);

// Logout
router.post("/logout", authMiddleware, logout);

// Forgot password
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  validate,
  forgotPassword
);

// Reset password
router.post(
  "/reset-password",
  resetPasswordValidation,
  validate,
  resetPassword
);

module.exports = router;
