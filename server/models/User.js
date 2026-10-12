const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            default: ""
        },

        googleId: {
            type: String,
            default: ""
        },

        avatar: {
            type: String,
            default: ""
        },

        // Internal Kavro Credits balance. Credits can only be spent on
        // eligible Kavro orders; they are not cash and cannot be withdrawn.
        kavroCredits: {
            type: Number,
            default: 0,
            min: 0
        },

        resetPasswordToken: {
            type: String,
            default: ""
        },

        resetPasswordExpires: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
