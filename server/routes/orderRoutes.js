const express = require("express");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");

const router = express.Router();

const Order = require("../models/Order");
const User = require("../models/User");
const ProductItem = require("../models/ProductItem");
const { requireAdmin } = require("../middleware/auth");


// =====================================================
// RESEND EMAIL
// =====================================================

const resend = new Resend(
    process.env.RESEND_API_KEY
);

const EMAIL_FROM =
    process.env.RESEND_FROM_EMAIL ||
    "Kavro <orders@kavronepal.vercel.app>";

// Email is handled manually by the Kavro admin.
// Keep automated admin/customer messages disabled.
const AUTOMATIC_ORDER_EMAILS_ENABLED = false;


// =====================================================
// CREATE NEW ORDER
// =====================================================

router.post("/", async (req, res) => {

    try {

        const orderType =
            req.body.type || "game";

        let linkedUser = null;
        const authHeader = req.headers.authorization || "";
        const bearerToken = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : "";

        if (!bearerToken) {
            return res.status(401).json({
                success: false,
                message: "Please sign in before placing an order."
            });
        }

        try {
            const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
            linkedUser = await User.findById(decoded.id);
            if (!linkedUser) throw new Error("User not found.");
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Your login expired. Please sign in again."
            });
        }

        const customerEmail = String(
            req.body.email || linkedUser?.email || ""
        ).trim().toLowerCase();

        const whatsapp = String(req.body.whatsapp || "").trim();
        const requestedProduct = String(req.body.product || "").trim();

        if (requestedProduct !== "Roblox" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid delivery email address."
            });
        }

        if (requestedProduct === "Roblox" && !whatsapp && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
            return res.status(400).json({ success: false, message: "Enter either a WhatsApp number or delivery email." });
        }

        const transactionId =
            (req.body.transactionId || "").trim();

        let orderProduct = String(req.body.product || "").trim();
        let orderPackage = String(req.body.package || "").trim();
        let orderPrice = String(req.body.price || "").trim();
        let unitPrice = String(req.body.unitPrice || "").trim();
        let quantity = Math.max(
            1,
            Number.parseInt(req.body.quantity || "1", 10) || 1
        );

        const managedProductSlugs = {
            "UniPin BD Voucher": "unipin",
            "Mobile Legends": "mlbb"
        };

        const managedProductSlug = managedProductSlugs[orderProduct];

        if (managedProductSlug) {
            let productItem = null;

            if (req.body.item) {
                productItem = await ProductItem
                    .findById(req.body.item)
                    .populate("product", "name slug");
            }

            // Support checkout links created before item IDs were added.
            if (!productItem) {
                const matchingItems = await ProductItem
                    .find({
                        active: true
                    })
                    .populate("product", "name slug");

                const normalizedPackage = orderPackage
                    .trim()
                    .replace(/\s+/g, " ")
                    .toLowerCase();

                productItem = matchingItems.find(item =>
                    item.product &&
                    (
                        item.product.slug === managedProductSlug ||
                        item.product.name === orderProduct
                    ) &&
                    String(item.title || "")
                        .trim()
                        .replace(/\s+/g, " ")
                        .toLowerCase() === normalizedPackage
                ) || null;
            }

            if (!productItem || !productItem.active) {
                return res.status(400).json({
                    success: false,
                    message: "This package is not available."
                });
            }

            if (
                !productItem.product ||
                (
                    productItem.product.slug !== managedProductSlug &&
                    productItem.product.name !== orderProduct
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "The selected package does not match this product."
                });
            }

            if (quantity > productItem.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${productItem.stock} voucher(s) are currently available.`
                });
            }

            const finalUnitPrice =
                productItem.discountPrice > 0 &&
                productItem.discountPrice < productItem.price
                    ? productItem.discountPrice
                    : productItem.price;

            // Older/cached checkout links may send a total but omit the item ID
            // and incorrectly fall back to quantity 1. Recover the intended
            // quantity from the submitted total in that case.
            if (!req.body.item || !req.body.quantity) {
                const submittedTotal = Number(
                    String(req.body.price || "")
                        .replace(/[^0-9.]/g, "")
                );
                const inferredQuantity = submittedTotal / finalUnitPrice;

                if (
                    Number.isInteger(inferredQuantity) &&
                    inferredQuantity >= 1
                ) {
                    quantity = inferredQuantity;
                }
            }

            if (quantity > productItem.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${productItem.stock} voucher(s) are currently available.`
                });
            }

            orderPackage = productItem.title;
            unitPrice = `Rs. ${finalUnitPrice}`;
            orderPrice = `Rs. ${finalUnitPrice * quantity}`;
        } else {
            quantity = 1;
        }

        const uid =
            (req.body.uid || "").trim();

        const zoneId =
            String(req.body.zoneId || "").trim();

        if (
            orderProduct === "Mobile Legends" &&
            (
                !/^\d{4,20}$/.test(uid) ||
                !/^\d{1,10}$/.test(zoneId)
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid Player ID and Zone / Server ID."
            });
        }

        let playerName = "";
        let playerRegion = "";
        let uidVerifiedAt = null;

        if (
            req.body.product === "Free Fire" &&
            process.env.FF_LOOKUP_API_KEY
        ) {
            try {
                const verifiedPlayer = jwt.verify(
                    req.body.uidVerificationToken || "",
                    process.env.JWT_SECRET
                );

                if (
                    verifiedPlayer.purpose !== "free-fire-uid-verification" ||
                    verifiedPlayer.uid !== uid ||
                    verifiedPlayer.playerRegion !== "BD"
                ) {
                    throw new Error("UID verification does not match this order.");
                }

                playerName = verifiedPlayer.playerName;
                playerRegion = verifiedPlayer.playerRegion;
                uidVerifiedAt = new Date();
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "Please verify the Free Fire UID again before ordering."
                });
            }
        }


        // =================================================
        // DUPLICATE TRANSACTION CHECK
        // =================================================

        if (transactionId !== "") {

            const existingOrder =
                await Order.findOne({

                    transactionId

                });


            if (existingOrder) {

                return res.status(409).json({

                    success: false,

                    message:
                        "This transaction ID has already been used. Please check your transaction ID."

                });

            }

        }


        // =================================================
        // CREATE ORDER
        // =================================================

        const order =
            new Order({

                userId: linkedUser?._id || null,

                product:
                    orderProduct,

                package:
                    orderPackage,

                price:
                    orderPrice,

                unitPrice,

                quantity,

                uid,

                zoneId,

                playerName,

                playerRegion,

                uidVerifiedAt,

                email:
                    customerEmail,

                customerName:
                    req.body.customerName || "",

                phone:
                    req.body.phone || "",

                whatsapp,

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


        // =================================================
        // SAVE ORDER
        // =================================================

        await order.save();


        // =================================================
        // SOCKET NOTIFICATION
        // =================================================

        const io =
            req.app.get("io");


        if (io) {

            io.emit(
                "newOrder",
                order
            );

        }


        // =================================================
        // NEW ORDER EMAIL TO ADMIN
        // =================================================

        if (AUTOMATIC_ORDER_EMAILS_ENABLED) resend.emails.send({

            from:
                EMAIL_FROM,

            to: [
                process.env.EMAIL_USER
            ],

            subject:
                `New Kavro Order - ${order.product}`,

            html: `

                <div
                    style="
                        font-family:Arial,sans-serif;
                        padding:24px;
                        max-width:650px;
                        margin:auto;
                    "
                >

                    <h2
                        style="
                            color:#2563eb;
                            margin-bottom:24px;
                        "
                    >
                        New Order Received
                    </h2>


                    <table
                        style="
                            width:100%;
                            border-collapse:collapse;
                        "
                    >

                        <tr>

                            <td
                                style="
                                    padding:8px 0;
                                "
                            >
                                <strong>
                                    Product
                                </strong>
                            </td>

                            <td
                                style="
                                    padding:8px 0;
                                "
                            >
                                ${order.product}
                            </td>

                        </tr>


                        <tr>

                            <td
                                style="
                                    padding:8px 0;
                                "
                            >
                                <strong>
                                    Package
                                </strong>
                            </td>

                            <td
                                style="
                                    padding:8px 0;
                                "
                            >
                                ${order.package}
                            </td>

                        </tr>


                        <tr>

                            <td
                                style="
                                    padding:8px 0;
                                "
                            >
                                <strong>
                                    Price
                                </strong>
                            </td>

                            <td
                                style="
                                    padding:8px 0;
                                "
                            >
                                ${order.price}
                            </td>

                        </tr>


                        ${
                            order.type === "subscription"
                                ? `

                                    <tr>

                                        <td
                                            style="
                                                padding:8px 0;
                                            "
                                        >
                                            <strong>
                                                Customer Email
                                            </strong>
                                        </td>

                                        <td
                                            style="
                                                padding:8px 0;
                                            "
                                        >
                                            ${order.email}
                                        </td>

                                    </tr>


                                    <tr>

                                        <td
                                            style="
                                                padding:8px 0;
                                            "
                                        >
                                            <strong>
                                                Customer Name
                                            </strong>
                                        </td>

                                        <td
                                            style="
                                                padding:8px 0;
                                            "
                                        >
                                            ${order.customerName || "N/A"}
                                        </td>

                                    </tr>


                                    <tr>

                                        <td
                                            style="
                                                padding:8px 0;
                                            "
                                        >
                                            <strong>
                                                Phone
                                            </strong>
                                        </td>

                                        <td
                                            style="
                                                padding:8px 0;
                                            "
                                        >
                                            ${order.phone || "N/A"}
                                        </td>

                                    </tr>

                                  `
                                : `

                                    <tr>

                                        <td
                                            style="
                                                padding:8px 0;
                                            "
                                        >
                                            <strong>
                                                UID
                                            </strong>
                                        </td>

                                        <td
                                            style="
                                                padding:8px 0;
                                            "
                                        >
                                            ${order.uid || "N/A"}
                                        </td>

                                    </tr>


                                    <tr>

                                        <td
                                            style="
                                                padding:8px 0;
                                            "
                                        >
                                            <strong>
                                                Customer Email
                                            </strong>
                                        </td>

                                        <td
                                            style="
                                                padding:8px 0;
                                            "
                                        >
                                            ${order.email || "N/A"}
                                        </td>

                                    </tr>

                                  `
                        }


                        <tr>

                            <td
                                style="
                                    padding:8px 0;
                                "
                            >
                                <strong>
                                    Payment Method
                                </strong>
                            </td>

                            <td
                                style="
                                    padding:8px 0;
                                "
                            >
                                ${order.paymentMethod}
                            </td>

                        </tr>


                        <tr>

                            <td
                                style="
                                    padding:8px 0;
                                "
                            >
                                <strong>
                                    Transaction ID
                                </strong>
                            </td>

                            <td
                                style="
                                    padding:8px 0;
                                "
                            >
                                ${order.transactionId || "N/A"}
                            </td>

                        </tr>

                    </table>


                    <br>


                    <p>
                        <strong>
                            Payment Screenshot
                        </strong>
                    </p>


                    ${
                        order.screenshot
                            ? `

                                <p>
                                    <a
                                        href="${order.screenshot}"
                                        target="_blank"
                                        style="
                                            color:#2563eb;
                                        "
                                    >
                                        View Payment Screenshot
                                    </a>
                                </p>

                              `
                            : `

                                <p>
                                    No screenshot provided.
                                </p>

                              `
                    }


                    <br>


                    <p>

                        <strong>
                            Customer Note:
                        </strong>

                        <br>

                        ${order.note || "No note"}

                    </p>

                </div>

            `

        })

        .then(({ data, error }) => {

            if (error) {

                console.error(
                    "❌ New order email failed:",
                    error
                );

                return;
            }


            console.log(
                "✅ New order email sent:",
                data?.id
            );

        })

        .catch((error) => {

            console.error(
                "❌ New order email failed:",
                error.message
            );

        });


        // =================================================
        // RETURN SUCCESS
        // =================================================

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


// =====================================================
// GET CUSTOMER ORDERS
// =====================================================

router.get("/my-orders", async (req, res) => {

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


        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid token."

            });

        }


        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        const user =
            await User.findById(
                decoded.id
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        const orders =
            await Order.find({
                $or: [
                    { userId: user._id },
                    { email: String(user.email).trim().toLowerCase() }
                ]
            })
            .sort({

                createdAt:
                    -1

            });


        return res.json({

            success: true,

            orders

        });

    }


    catch (err) {

        console.error(
            "MY ORDERS ERROR:",
            err
        );


        return res.status(401).json({

            success: false,

            message:
                "Invalid or expired token."

        });

    }

});


// =====================================================
// GET ALL ORDERS
// PROTECTED
// =====================================================

router.get("/", requireAdmin, async (req, res) => {

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


        jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        const orders =
            await Order
                .find()
                .sort({

                    createdAt:
                        -1

                });


        return res.json(
            orders
        );

    }


    catch (err) {

        console.error(
            "GET ORDERS ERROR:",
            err
        );


        return res.status(401).json({

            success: false,

            message:
                "Unauthorized."

        });

    }

});


// =====================================================
// UPDATE ORDER STATUS
// =====================================================

router.patch("/:id", requireAdmin, async (req, res) => {

    try {

        const allowedStatuses = [
            "Pending",
            "Payment Verified",
            "Processing",
            "Completed",
            "Rejected",
            "Refund Required"
        ];

        const requestedStatus = String(req.body.status || "").trim();

        if (!allowedStatuses.includes(requestedStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status."
            });
        }

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


        jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        const now = new Date();
        const statusFields = { status: requestedStatus };

        if (requestedStatus === "Payment Verified") {
            statusFields.paymentVerifiedAt = now;
        }

        if (requestedStatus === "Processing") {
            statusFields.processingStartedAt = now;
        }

        if (requestedStatus === "Completed") {
            statusFields.completedAt = now;
        }

        const order =
            await Order.findByIdAndUpdate(

                req.params.id,

                {
                    $set: statusFields,
                    $push: {
                        statusHistory: {
                            status: requestedStatus,
                            changedAt: now,
                            changedBy: String(req.admin.id || "admin")
                        }
                    }
                },

                {

                    new:
                        true

                }

            );


        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found."

            });

        }


        // =================================================
        // CUSTOMER DELIVERY EMAIL
        // =================================================

        if (
            AUTOMATIC_ORDER_EMAILS_ENABLED &&
            requestedStatus === "Completed" &&
            order.email
        ) {

            console.log(
                "📧 Sending delivery email to:",
                order.email
            );


            resend.emails.send({

                from:
                    EMAIL_FROM,

                to: [
                    order.email
                ],

                subject:
                    "Your Kavro Order Has Been Completed!",

                html: `

                    <div
                        style="
                            font-family:Arial,sans-serif;
                            padding:24px;
                            max-width:650px;
                            margin:auto;
                        "
                    >

                        <h2
                            style="
                                color:#2563eb;
                            "
                        >
                            Your Order Has Been Completed
                        </h2>


                        <p>
                            Hello,
                        </p>


                        <p>
                            Your Kavro order has been successfully completed.
                        </p>


                        <table
                            style="
                                width:100%;
                                border-collapse:collapse;
                            "
                        >

                            <tr>

                                <td
                                    style="
                                        padding:8px 0;
                                    "
                                >
                                    <strong>
                                        Product
                                    </strong>
                                </td>

                                <td
                                    style="
                                        padding:8px 0;
                                    "
                                >
                                    ${order.product}
                                </td>

                            </tr>


                            <tr>

                                <td
                                    style="
                                        padding:8px 0;
                                    "
                                >
                                    <strong>
                                        Package
                                    </strong>
                                </td>

                                <td
                                    style="
                                        padding:8px 0;
                                    "
                                >
                                    ${order.package}
                                </td>

                            </tr>


                            ${
                                order.type === "subscription"
                                    ? `

                                        <tr>

                                            <td
                                                style="
                                                    padding:8px 0;
                                                "
                                            >
                                                <strong>
                                                    Email
                                                </strong>
                                            </td>

                                            <td
                                                style="
                                                    padding:8px 0;
                                                "
                                            >
                                                ${order.email}
                                            </td>

                                        </tr>

                                      `
                                    : `

                                        <tr>

                                            <td
                                                style="
                                                    padding:8px 0;
                                                "
                                            >
                                                <strong>
                                                    UID
                                                </strong>
                                            </td>

                                            <td
                                                style="
                                                    padding:8px 0;
                                                "
                                            >
                                                ${order.uid || "N/A"}
                                            </td>

                                        </tr>

                                      `
                            }


                            <tr>

                                <td
                                    style="
                                        padding:8px 0;
                                    "
                                >
                                    <strong>
                                        Price
                                    </strong>
                                </td>

                                <td
                                    style="
                                        padding:8px 0;
                                    "
                                >
                                    ${order.price}
                                </td>

                            </tr>

                        </table>


                        <br>


                        <p>
                            Thank you for choosing
                            <strong>
                                Kavro
                            </strong>.
                        </p>


                        <p>
                            We hope to serve you again!
                        </p>

                    </div>

                `

            })

            .then(({ data, error }) => {

                if (error) {

                    console.error(
                        "❌ Delivery email failed:",
                        error
                    );

                    return;
                }


                console.log(
                    "✅ Delivery email sent:",
                    data?.id
                );

            })

            .catch((error) => {

                console.error(
                    "❌ Delivery email failed:",
                    error.message
                );

            });

        }


        // =================================================
        // SOCKET UPDATE
        // =================================================

        const io =
            req.app.get("io");


        if (io) {

            io.emit(
                "orderUpdated",
                order
            );

        }


        return res.json({

            success: true,

            message:
                "Order updated successfully.",

            order

        });

    }


    catch (err) {

        console.error(
            "UPDATE ORDER ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to update order."

        });

    }

});


// =====================================================
// DELETE ORDER
// =====================================================

router.delete("/:id", requireAdmin, async (req, res) => {

    try {

        const authHeader =
            req.headers.authorization;


        if (!authHeader) {

            return res.status(401).json({

                success: false,

                message:
                    "No token."

            });

        }


        const token =
            authHeader.split(" ")[1];


        jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        await Order.findByIdAndDelete(
            req.params.id
        );


        return res.json({

            success: true,

            message:
                "Order deleted."

        });

    }


    catch (err) {

        console.error(
            "DELETE ORDER ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Delete failed."

        });

    }

});


module.exports = router;
