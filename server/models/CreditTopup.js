const mongoose = require("mongoose");

const creditTopupSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    paymentMethod: {
        type: String,
        enum: ["eSewa", "Bank Transfer"],
        required: true
    },
    screenshot: {
        type: String,
        required: true
    },
    remarks: {
        type: String,
        default: "",
        maxlength: 500
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending",
        index: true
    },
    adminNote: {
        type: String,
        default: ""
    },
    approvedAt: {
        type: Date,
        default: null
    },
    approvedBy: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("CreditTopup", creditTopupSchema);
