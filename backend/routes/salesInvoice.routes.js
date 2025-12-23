const express = require("express");
const router = express.Router();
const controller = require("../controllers/salesInvoice.controller");

router.post("/create", controller.createSalesInvoice);
router.get("/list", controller.getSalesInvoices);
router.get("/:id", controller.getSalesInvoiceById);
router.put("/cancel/:id", controller.cancelSalesInvoice);

module.exports = router;
