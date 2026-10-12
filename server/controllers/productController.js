const Product = require("../models/Product");

// =======================
// ADD PRODUCT
// =======================

exports.addProduct = async (req, res) => {

    try {

        const product = new Product({

            name: req.body.name,
            slug: req.body.slug,
            category: req.body.category,
            price: req.body.price,
            discountPrice: req.body.discountPrice,
            image: req.body.image,
            description: req.body.description,
            featured: req.body.featured,
            active: req.body.active

        });

        await product.save();

        res.status(201).json({

            success: true,
            message: "Product added successfully.",
            product

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: "Failed to add product."

        });

    }

};


// =======================
// GET ALL PRODUCTS
// =======================

exports.getProducts = async (req, res) => {
console.log("GET /api/products called");

    try {

        const products = await Product.find().sort({

            createdAt: -1

        });

        res.json(products);

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: "Failed to load products."

        });

    }

};


// =======================
// GET SINGLE PRODUCT
// =======================

exports.getProduct = async (req, res) => {

    try {

        const product = await Product.findById(req.params.id);

        if (!product) {

            return res.status(404).json({

                success: false,
                message: "Product not found."

            });

        }

        res.json(product);

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

};


// =======================
// GET PRODUCT BY SLUG
// =======================

exports.getProductBySlug = async (req, res) => {

    try {

        const product = await Product.findOne({

            slug: req.params.slug

        });

        if (!product) {

            return res.status(404).json({

                success:false,
                message:"Product not found."

            });

        }

        res.json(product);

    }

    catch(err){

        console.error(err);

        res.status(500).json({

            success:false,
            message:"Server Error"

        });

    }

};



// =======================
// UPDATE PRODUCT
// =======================

exports.updateProduct = async (req, res) => {

    try {

        const product = await Product.findByIdAndUpdate(

            req.params.id,

            req.body,

            {

                new: true

            }

        );

        res.json({

            success: true,
            message: "Product updated successfully.",
            product

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: "Update failed."

        });

    }

};


// =======================
// DELETE PRODUCT
// =======================

exports.deleteProduct = async (req, res) => {

    try {

        await Product.findByIdAndDelete(req.params.id);

        res.json({

            success: true,
            message: "Product deleted."

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: "Delete failed."

        });

    }

};