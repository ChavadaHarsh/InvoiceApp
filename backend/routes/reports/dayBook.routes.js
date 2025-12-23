const express = require("express");
const router = express.Router();

const controller = require("../../controllers/dayBook.controller");

router.get("/", controller.getDayBook);

module.exports = router;
