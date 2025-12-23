const express = require("express");
const router = express.Router();

const controller = require("../../controllers/gstGstr1.controller");

router.get("/", controller.getGstr1);

module.exports = router;
