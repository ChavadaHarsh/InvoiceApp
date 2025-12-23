const express = require("express");
const router = express.Router();
const controller = require("../controllers/category.controller");

router.post("/create", controller.createCategory);
router.get("/list", controller.getCategories);
router.put("/update/:id", controller.updateCategory);

module.exports = router;
