const express = require("express");
const router = express.Router();

const controller = require("../../controllers/profitLoss.controller");

router.get("/", controller.getProfitLoss);

module.exports = router;
