const express = require("express");
const router = express.Router();

const controller = require("../controllers/financialYear.controller");

/* =====================================================
   FINANCIAL YEAR ROUTES
===================================================== */

// LOCK FINANCIAL YEAR
router.post("/lock", controller.lockFinancialYear);

// UNLOCK FINANCIAL YEAR
router.post("/unlock", controller.unlockFinancialYear);

// LIST FINANCIAL YEARS (optional but useful)
router.get("/list", controller.getFinancialYears);

module.exports = router;
