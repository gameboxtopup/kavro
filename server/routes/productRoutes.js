const express = require("express");
const router = express.Router();

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

router.post("/", addProduct);

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

router.put("/:id", updateProduct);

// =======================
// DELETE PRODUCT
// =======================

router.delete("/:id", deleteProduct);

module.exports = router;