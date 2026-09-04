const express = require("express");
const jwt = require("jsonwebtoken");

const ChatMessage = require("../models/ChatMessage");
const Admin = require("../models/Admin");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();


// =========================================
// CUSTOMER SEND MESSAGE
// =========================================

router.post("/", async (req, res) => {

    try {

        const authHeader =
            req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({
                success: false,
                message: "No token provided."
            });

        }

        const token =
            authHeader.split(" ")[1];

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        const message =
            String(
                req.body.message || ""
            ).trim();

        if (!message) {

            return res.status(400).json({
                success: false,
                message: "Message is required."
            });

        }

        const chatMessage =
            await ChatMessage.create({

                userId: decoded.id,

                sender: "user",

                message: message

            });


        const io =
            req.app.get("io");

        if (io) {

            io.emit(
                "chatMessage",
                {

                    userId: decoded.id,

                    sender: "user",

                    message,

                    createdAt:
                        chatMessage.createdAt

                }
            );

        }


        return res.status(201).json({

            success: true,

            message: chatMessage

        });

    }

    catch (error) {

        console.error(
            "CUSTOMER CHAT ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Could not send message."

        });

    }

});


// =========================================
// CUSTOMER GET CHAT
// =========================================

router.get("/", async (req, res) => {

    try {

        const authHeader =
            req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({
                success: false,
                message: "No token provided."
            });

        }

        const token =
            authHeader.split(" ")[1];

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        const messages =
            await ChatMessage
                .find({
                    userId: decoded.id
                })
                .sort({
                    createdAt: 1
                });


        return res.json({

            success: true,

            messages

        });

    }

    catch (error) {

        console.error(
            "GET CUSTOMER CHAT ERROR:",
            error
        );

        return res.status(401).json({

            success: false,

            message:
                "Unauthorized."

        });

    }

});


// =========================================
// ADMIN SEND REPLY
// =========================================

router.post("/admin/reply", requireAdmin, async (req, res) => {

    try {

        const authHeader =
            req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({
                success: false,
                message: "No token provided."
            });

        }


        const token =
            authHeader.split(" ")[1];


        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // Check that token belongs to a real admin

        const admin =
            await Admin.findById(
                decoded.id
            );


        if (!admin) {

            return res.status(403).json({

                success: false,

                message:
                    "Admin access required."

            });

        }


        const userId =
            req.body.userId;

        const message =
            String(
                req.body.message || ""
            ).trim();


        if (!userId || !message) {

            return res.status(400).json({

                success: false,

                message:
                    "User ID and message are required."

            });

        }


        const chatMessage =
            await ChatMessage.create({

                userId,

                sender: "admin",

                message

            });


        const io =
            req.app.get("io");


        if (io) {

            io.emit(
                "chatMessage",
                {

                    userId,

                    sender: "admin",

                    message,

                    createdAt:
                        chatMessage.createdAt

                }
            );

        }


        return res.status(201).json({

            success: true,

            message: chatMessage

        });

    }

    catch (error) {

        console.error(
            "ADMIN CHAT ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Could not send admin message."

        });

    }

});


// =========================================
// ADMIN GET ALL CHAT MESSAGES
// =========================================

router.get("/admin/all", requireAdmin, async (req, res) => {

    try {

        const authHeader =
            req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({

                success: false,

                message:
                    "No token provided."

            });

        }


        const token =
            authHeader.split(" ")[1];


        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        const admin =
            await Admin.findById(
                decoded.id
            );


        if (!admin) {

            return res.status(403).json({

                success: false,

                message:
                    "Admin access required."

            });

        }


        const messages =
            await ChatMessage
                .find()
                .populate("userId", "name email")
                .sort({
                    createdAt: 1
                });


        return res.json({

            success: true,

            messages

        });

    }

    catch (error) {

        console.error(
            "ADMIN GET CHAT ERROR:",
            error
        );

        return res.status(401).json({

            success: false,

            message:
                "Unauthorized."

        });

    }

});


module.exports = router;
