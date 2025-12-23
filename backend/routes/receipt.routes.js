const express = require("express");
const router = express.Router();

const controller = require("../controllers/receipt.controller");

router.post("/create", controller.createReceipt);
router.get("/list", controller.getReceipts);
router.get("/:id", controller.getReceiptById);
router.put("/cancel/:id", controller.cancelReceipt);

module.exports = router;
