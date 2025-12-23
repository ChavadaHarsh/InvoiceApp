const express = require("express");
const router = express.Router();
const controller = require("../controllers/product.controller");

router.post("/create", controller.createProduct);
router.get("/list", controller.getProducts);

module.exports = router;
