const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    product: {
        type: String,
        required: true
    },

    package: {
        type: String,
        required: true
    },

    price: {
        type: String,
        required: true
    },

    // =========================
    // GAME ORDERS
    // =========================

    uid: {
        type: String,
        default: ""
    },

    // =========================
    // SUBSCRIPTION ORDERS
    // =========================

    email: {
        type: String,
        default: ""
    },

    customerName: {
        type: String,
        default: ""
    },

    phone: {
        type: String,
        default: ""
    },

    paymentMethod: {
        type: String,
        default: ""
    },

    transactionId: {
        type: String,
        default: ""
    },

    screenshot: {
        type: String,
        default: ""
    },

    note: {
        type: String,
        default: ""
    },

    type: {
        type: String,
        default: "game"
    },

    status: {
        type: String,
        default: "Pending"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Order", orderSchema);