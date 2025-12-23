const express = require("express");
const router = express.Router();
const controller = require("../controllers/unit.controller");

router.post("/create", controller.createUnit);
router.get("/list", controller.getUnits);

module.exports = router;
