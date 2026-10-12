const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");

const {

    addProduct,
    getProducts,
    getProduct,
    getProductBySlug,
    updateProduct,
    deleteProduct

} = require("../controllers/productController");

// =======================
// ADD PRODUCT
// =======================

router.post("/", requireAdmin, addProduct);

// =======================
// GET ALL PRODUCTS
// =======================

router.get("/", getProducts);

// =======================
// GET SINGLE PRODUCT
// =======================

router.get("/slug/:slug", getProductBySlug);

router.get("/:id", getProduct);

// =======================
// UPDATE PRODUCT
// =======================

router.put("/:id", requireAdmin, updateProduct);

// =======================
// DELETE PRODUCT
// =======================

router.delete("/:id", requireAdmin, deleteProduct);

module.exports = router;
