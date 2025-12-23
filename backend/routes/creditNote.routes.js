const express = require("express");
const router = express.Router();

const creditNoteController = require("../controllers/creditNote.controller");

// CREATE CREDIT NOTE (Sales Return)
router.post("/create", creditNoteController.createCreditNote);

// CANCEL CREDIT NOTE
router.put("/cancel/:id", creditNoteController.cancelCreditNote);

module.exports = router;
