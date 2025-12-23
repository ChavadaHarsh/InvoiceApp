const express = require("express");
const router = express.Router();

const controller = require("../controllers/payment.controller");

router.post("/create", controller.createPayment);
router.get("/list", controller.getPayments);
router.get("/:id", controller.getPaymentById);
router.put("/cancel/:id", controller.cancelPayment);

module.exports = router;
