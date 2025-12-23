const express = require("express");
const router = express.Router();

const controller = require("../../controllers/bankBook.controller");

router.get("/", controller.getBankBook);

module.exports = router;
