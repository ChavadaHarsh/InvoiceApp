const express = require("express");
const router = express.Router();
const controller = require("../controllers/party.controller");

router.post("/create", controller.createParty);
router.get("/list", controller.getParties);
router.put("/update/:id", controller.updateParty);

module.exports = router;
