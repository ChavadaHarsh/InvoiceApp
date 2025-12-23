const express = require("express");
const router = express.Router();

const controller = require("../controllers/debitNote.controller");

// CREATE DEBIT NOTE (Purchase Return)
router.post("/create", controller.createDebitNote);

// CANCEL DEBIT NOTE
router.put("/cancel/:id", controller.cancelDebitNote);

module.exports = router;
