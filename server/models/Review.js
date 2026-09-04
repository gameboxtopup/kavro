const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
        unique: true,
        index: true
    },
    product: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 500 },
    customerName: { type: String, required: true, trim: true, maxlength: 80 },
    verifiedPurchase: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Review", reviewSchema);
