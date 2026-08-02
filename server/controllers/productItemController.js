const ProductItem = require("../models/ProductItem");

// Get all product items
exports.getItems = async (req, res) => {
    try {
        const items = await ProductItem.find().populate("product");

        res.json(items);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};

// Create item
exports.createItem = async (req, res) => {

    try {

        const item = await ProductItem.create(req.body);

        res.json({
            message: "Product Item Added",
            item
        });

    } catch (err) {

        res.status(400).json({
            message: err.message
        });

    }

};

// Update item
exports.updateItem = async (req, res) => {

    try {

        await ProductItem.findByIdAndUpdate(
            req.params.id,
            req.body
        );

        res.json({
            message: "Product Item Updated"
        });

    } catch (err) {

        res.status(400).json({
            message: err.message
        });

    }

};

// Delete item
exports.deleteItem = async (req, res) => {

    try {

        await ProductItem.findByIdAndDelete(req.params.id);

        res.json({
            message: "Product Item Deleted"
        });

    } catch (err) {

        res.status(400).json({
            message: err.message
        });

    }

};

// Get single product item
exports.getItem = async (req, res) => {

    try {

        const item = await ProductItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        res.json(item);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};