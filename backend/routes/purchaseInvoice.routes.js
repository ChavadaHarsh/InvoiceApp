const express = require("express");
const router = express.Router();
const controller = require("../controllers/purchaseInvoice.controller");

router.post("/create", controller.createPurchaseInvoice);
router.get("/list", controller.getPurchaseInvoices);
router.get("/:id", controller.getPurchaseInvoiceById);
router.put("/cancel/:id", controller.cancelPurchaseInvoice);

module.exports = router;
