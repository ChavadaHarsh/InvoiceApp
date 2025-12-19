const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");

const {
  createCompany,
  getCompanies,
  selectCompany,
  switchCompany,
  getActiveCompany,
} = require("../controllers/company.controller");

router.post("/", auth, createCompany);
router.get("/", auth, getCompanies);

router.post("/select", auth, selectCompany);
router.post("/switch", auth, switchCompany);
router.get("/active", auth, getActiveCompany);

module.exports = router;
