const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    sender: {
        type: String,
        enum: ["user", "admin"],
        required: true
    },

    message: {
        type: String,
        required: true,
        maxlength: 500
    }

}, {
    timestamps: true
});

module.exports =
    mongoose.model(
        "ChatMessage",
        chatMessageSchema
    );