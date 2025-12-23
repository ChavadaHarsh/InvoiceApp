const express = require("express");
const router = express.Router();

const controller = require("../../controllers/gstItc.controller");

router.get("/", controller.getItc);

module.exports = router;
