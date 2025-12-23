const express = require("express");
const router = express.Router();

const dayBook = require("../controllers/dayBook.controller");
const cashBook = require("../controllers/cashBook.controller");
const bankBook = require("../controllers/bankBook.controller");

router.get("/day-book", dayBook.getDayBook);
router.get("/cash-book", cashBook.getCashBook);
router.get("/bank-book", bankBook.getBankBook);

module.exports = router;
