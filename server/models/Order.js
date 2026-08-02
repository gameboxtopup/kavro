const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
{
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

    uid: {
        type: String,
        required: true
    },

    email: {
    type: String,
    required: true
},

    paymentMethod: {
        type: String,
        required: true
    },

    transactionId: {
        type: String,
        required: true,
        unique: true
    },

    screenshot: {
        type: String,
        required: true
    },

    note: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        default: "Pending"
    }

},
{
    timestamps: true
});

module.exports = mongoose.model("Order", orderSchema);