const express = require("express");
const router = express.Router();

const controller = require("../../controllers/balanceSheet.controller");

router.get("/", controller.getBalanceSheet);

module.exports = router;
