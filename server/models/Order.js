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

    playerName: {
        type: String,
        default: ""
    },

    playerRegion: {
        type: String,
        default: ""
    },

    uidVerifiedAt: {
        type: Date,
        default: null
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
    },

    paymentVerifiedAt: {
        type: Date,
        default: null
    },

    processingStartedAt: {
        type: Date,
        default: null
    },

    completedAt: {
        type: Date,
        default: null
    },

    statusHistory: [{
        status: String,
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: String
    }]

}, {
    timestamps: true
});

module.exports = mongoose.model("Order", orderSchema);
