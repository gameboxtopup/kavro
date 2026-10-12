const express = require("express");

const router = express.Router();
const { requireAdmin } = require("../middleware/auth");

const controller = require("../controllers/productItemController");

router.get("/", controller.getItems);

router.get("/product/:productId", controller.getItemsByProduct);

router.get("/:id", controller.getItem);

router.post("/", requireAdmin, controller.createItem);

router.put("/:id", requireAdmin, controller.updateItem);

router.delete("/:id", requireAdmin, controller.deleteItem);

module.exports = router;
