const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

const Order = require("../models/Order");

// Create New Order
// Create New Order
router.post("/", async (req, res) => {

    try {

        const orderType = req.body.type || "game";

        const transactionId =
            req.body.transactionId || "";

        // =========================================
        // SUBSCRIPTION ONLY
        // CHECK DUPLICATE TRANSACTION ID
        // =========================================

        if (
            orderType === "subscription" &&
            transactionId.trim() !== ""
        ) {

            const existingOrder = await Order.findOne({
                transactionId: transactionId.trim(),
                type: "subscription"
            });

            if (existingOrder) {

                return res.status(409).json({
                    success: false,
                    message:
                        "This transaction ID has already been used. Please check your transaction ID."
                });

            }

        }

        // =========================================
        // CREATE ORDER
        // =========================================

        const order = new Order({

            product:
                req.body.product,

            package:
                req.body.package,

            price:
                req.body.price,

            uid:
                req.body.uid || "",

            email:
                req.body.email || "",

            customerName:
                req.body.customerName || "",

            phone:
                req.body.phone || "",

            paymentMethod:
                req.body.paymentMethod ||
                req.body.payment ||
                "",

            transactionId:
                transactionId,

            screenshot:
                req.body.screenshot || "",

            note:
                req.body.note || "",

            type:
                orderType

        });

        await order.save();

        // =========================================
        // SOCKET NOTIFICATION
        // =========================================

        const io = req.app.get("io");

        if (io) {
            io.emit("newOrder", order);
        }

        // =========================================
        // EMAIL
        // =========================================

        await transporter.sendMail({

            from:
                `"Kavro Nepal" <${process.env.EMAIL_USER}>`,

            to:
                process.env.EMAIL_USER,

            subject:
                `🛒 New Order - ${order.product}`,

            html: `

            <div style="font-family:Arial,sans-serif;padding:20px;">

                <h2 style="color:#2563eb;">
                    New Order Received
                </h2>

                <table style="border-collapse:collapse;">

                    <tr>
                        <td>
                            <strong>🎮 Product</strong>
                        </td>

                        <td style="padding-left:15px;">
                            ${order.product}
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <strong>💎 Package</strong>
                        </td>

                        <td style="padding-left:15px;">
                            ${order.package}
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <strong>💰 Price</strong>
                        </td>

                        <td style="padding-left:15px;">
                            ${order.price}
                        </td>
                    </tr>

                    ${
                        order.type === "subscription"
                        ?
                        `
                        <tr>
                            <td>
                                <strong>📧 Email</strong>
                            </td>

                            <td style="padding-left:15px;">
                                ${order.email}
                            </td>
                        </tr>
                        `
                        :
                        `
                        <tr>
                            <td>
                                <strong>🆔 UID</strong>
                            </td>

                            <td style="padding-left:15px;">
                                ${order.uid}
                            </td>
                        </tr>
                        `
                    }

                    <tr>
                        <td>
                            <strong>💳 Payment</strong>
                        </td>

                        <td style="padding-left:15px;">
                            ${order.paymentMethod}
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <strong>🧾 Transaction ID</strong>
                        </td>

                        <td style="padding-left:15px;">
                            ${order.transactionId}
                        </td>
                    </tr>

                </table>

                <br>

                <p>
                    <strong>Payment Screenshot</strong>
                </p>

                <p>
                    <a
                        href="${order.screenshot}"
                        target="_blank"
                    >
                        View Screenshot
                    </a>
                </p>

                <br>

                <p>
                    <strong>Customer Note:</strong>
                    <br>
                    ${order.note || "No note"}
                </p>

            </div>

            `

        });

        // =========================================
        // SUCCESS
        // =========================================

        return res.status(201).json({

            success: true,

            message:
                "Order placed successfully.",

            order

        });

    }

    catch (err) {

        console.error(
            "ORDER SAVE ERROR:",
            err
        );

        // =========================================
        // DUPLICATE KEY SAFETY
        // SUBSCRIPTION ONLY
        // =========================================

        if (
            err.code === 11000 &&
            req.body.type === "subscription"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "This transaction ID has already been used. Please check your transaction ID."

            });

        }

        return res.status(500).json({

            success: false,

            message:
                "Failed to place order. Please try again."

        });

    }

});

const jwt = require("jsonwebtoken");

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS

    }

});

transporter.verify(function (error, success) {

    if (error) {

        console.log("❌ Gmail Error:");
        console.log(error);

    } else {

        console.log("✅ Gmail Ready");

    }

});

// Get All Orders (Protected)

router.get("/", async (req, res) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({
                success: false,
                message: "No token provided."
            });

        }

        const token = authHeader.split(" ")[1];

        jwt.verify(token, process.env.JWT_SECRET);

        const orders = await Order.find().sort({ createdAt: -1 });

        res.json(orders);

    }

    catch (err) {

        console.error(err);

        res.status(401).json({
            success: false,
            message: "Unauthorized."
        });

    }

});


// Update Order Status

router.patch("/:id", async (req, res) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({
                success: false,
                message: "No token provided."
            });

        }

        const token = authHeader.split(" ")[1];

        jwt.verify(token, process.env.JWT_SECRET);

        const order = await Order.findByIdAndUpdate(

            req.params.id,

            {
                status: req.body.status
            },

            {
                new: true
            }

        );

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found."
            });

        }

        // Send delivery email

if (req.body.status === "Delivered" && order.email) {
console.log("Sending delivery email to:", order.email);

    await transporter.sendMail({

        from: `"Kavro Nepal" <${process.env.EMAIL_USER}>`,

        to: order.email,

        subject: "🎉 Your Kavro Order Has Been Delivered!",

        html: `
        <div style="font-family:Arial,sans-serif;padding:20px;">

            <h2 style="color:#2563eb;">
                Your Order is Delivered!
            </h2>

            <p>Hello,</p>

            <p>Your order has been successfully delivered.</p>

            <table style="border-collapse:collapse;">

                <tr>
                    <td><strong>Product</strong></td>
                    <td style="padding-left:15px;">${order.product}</td>
                </tr>

                <tr>
                    <td><strong>Package</strong></td>
                    <td style="padding-left:15px;">${order.package}</td>
                </tr>

                ${
                order.type === "subscription"
                ?
                `
                <tr>
                <td><strong>Email</strong></td>
                <td style="padding-left:15px;">${order.email}</td>
                </tr>
                `
                :
                `
                <tr>
                <td><strong>UID</strong></td>
                <td style="padding-left:15px;">${order.uid}</td>
                </tr>
                `
                }

                <tr>
                    <td><strong>💰 Price</strong></td>
                    <td style="padding-left:15px;">${order.price}</td>
                </tr>

            </table>

            <br>

            <p>
                Thank you for choosing <strong>Kavro</strong>.
            </p>

            <p>
                We hope to serve you again!
            </p>

        </div>
        `

    });
    console.log("✅ Delivery email sent successfully.");

}

        const io = req.app.get("io");
        io.emit("orderUpdated", order);
        res.json({

            success: true,
            message: "Order updated successfully.",
            order

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: "Failed to update order."

        });

    }

});

// Delete Order
router.delete("/:id", async (req, res) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "No token."
            });
        }

        const token = authHeader.split(" ")[1];

        jwt.verify(token, process.env.JWT_SECRET);

        await Order.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Order deleted."
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Delete failed."
        });

    }

});

module.exports = router;