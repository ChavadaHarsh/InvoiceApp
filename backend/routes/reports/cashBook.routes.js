const express = require("express");
const router = express.Router();

const controller = require("../../controllers/cashBook.controller");

router.get("/", controller.getCashBook);

module.exports = router;
