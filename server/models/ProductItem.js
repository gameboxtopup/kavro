const mongoose = require("mongoose");

const productItemSchema = new mongoose.Schema({

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    title: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    discountPrice: {
        type: Number,
        default: 0
    },

    description: {
        type: String,
        default: ""
    },

    stock: {
        type: Number,
        default: 999
    },

    image: {
        type: String,
        default: ""
    },

    active: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("ProductItem", productItemSchema);