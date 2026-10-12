const express = require("express");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");

const router = express.Router();

const Order = require("../models/Order");
const { addOrder: addSmmOrder } = require("../services/smmNepali");
const User = require("../models/User");
const ProductItem = require("../models/ProductItem");
const { requireAdmin } = require("../middleware/auth");
const {
    createPubgTopup,
    isCompleted,
    isFailed
} = require("../services/fazerCards");
const { createRechargeOrder } = require("../services/rechargeGames");


// =====================================================
// RESEND EMAIL
// =====================================================

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const EMAIL_FROM =
    process.env.RESEND_FROM_EMAIL ||
    "Kavro <orders@kavronepal.vercel.app>";

// Email is handled manually by the Kavro admin.
// Keep automated admin/customer messages disabled.
const AUTOMATIC_ORDER_EMAILS_ENABLED = false;

function isPubgProduct(product) {
    return String(product || "").trim().toLowerCase() === "pubg mobile";
}

function parseAmount(value) {
    const amount = Number(String(value || "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(amount) ? amount : 0;
}

function isCreditPayment(paymentMethod) {
    const normalized = String(paymentMethod || "").trim().toLowerCase();
    return normalized === "kavro credits" || normalized === "kavro wallet";
}

function isFreeFireProduct(product) {
    return String(product || "").trim().toLowerCase() === "free fire";
}

async function submitFreeFireOrder(order) {
    if (!isFreeFireProduct(order.product) || order.providerOrderId) return order;
    const item = await ProductItem.findById(order.productItemId).populate("product", "name slug");
    const productKey = String(item?.providerProductKey || "").trim();
    if (!productKey) throw new Error("This Free Fire package has no RechargeGames product key configured.");
    const provider = await createRechargeOrder({
        productKey,
        playerId: order.uid,
        buyerRef: `KAVRO-${order._id}`,
        region: process.env.RECHARGE_FREE_FIRE_REGION || order.playerRegion || "Bangladesh",
        note: order.remarks || order.note || ""
    });
    order.providerOrderId = String(provider.order_id || provider.id || "");
    order.providerStatus = String(provider.status || "pending");
    if (provider.status === "delivered") {
        order.status = "Completed";
        order.completedAt = new Date();
    } else if (provider.status === "failed") {
        order.status = order.creditsDebited > 0 ? "Refunded" : "Refund Required";
    } else {
        order.status = "Processing";
        order.processingStartedAt = new Date();
    }
    await order.save();
    return order;
}

async function refundCreditsIfNeeded(order, reason) {
    if (!order || !order.userId || !order.creditsDebited || order.creditsRefunded) {
        return;
    }

    const updated = await Order.findOneAndUpdate(
        { _id: order._id, creditsRefunded: false },
        {
            $set: {
                creditsRefunded: true,
                providerStatus: reason || order.providerStatus || "refunded"
            }
        },
        { new: true }
    );

    if (updated) {
        await User.findByIdAndUpdate(order.userId, {
            $inc: { kavroCredits: Number(order.creditsDebited) }
        });
    }
}

async function submitPubgOrder(order) {
    if (!isPubgProduct(order.product)) {
        return order;
    }

    if (order.providerOrderId) {
        return order;
    }

    const provider = await createPubgTopup({
        categoryId: order.providerCategoryId || process.env.FAZER_PUBG_CATEGORY_ID,
        offerId: order.providerOfferId,
        playerId: order.uid,
        idempotencyKey: `kavro-${order._id}`
    });

    if (!provider.id) {
        throw new Error("FazerCards response did not include an order ID.");
    }

    order.providerOrderId = provider.id;
    order.providerStatus = provider.status || "submitted";

    if (isCompleted(provider.status)) {
        order.status = "Completed";
        order.completedAt = new Date();
    } else if (isFailed(provider.status)) {
        order.status = "Refund Required";
        await refundCreditsIfNeeded(order, provider.status);
    } else {
        order.status = "Processing";
        order.processingStartedAt = new Date();
    }

    await order.save();
    return order;
}


// =====================================================
// CREATE NEW ORDER
// =====================================================

router.post("/", async (req, res) => {

    try {

        const orderType =
            req.body.type || "game";

        let linkedUser = null;
        let debitedCredits = 0;
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
        const paymentMethod = String(
            req.body.paymentMethod || req.body.payment || ""
        ).trim();
        const pubgOrder = isPubgProduct(requestedProduct);
        const creditPayment = isCreditPayment(paymentMethod);

        const digitalCodeProduct = ["Roblox", "Steam Gift Card Global"].includes(requestedProduct);

        if (!digitalCodeProduct && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid delivery email address."
            });
        }

        if (digitalCodeProduct && !whatsapp && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
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
            "Mobile Legends": "mlbb",
            "PUBG Mobile": "pubg",
            "Free Fire": "ff"
        };

        const managedProductSlug = managedProductSlugs[orderProduct];
        let selectedProductItem = null;

        if (req.body.item) {
            selectedProductItem = await ProductItem.findById(req.body.item).populate("product", "name slug");
        }

        if (managedProductSlug) {
            let productItem = selectedProductItem;

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

            selectedProductItem = productItem;

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
        } else if (selectedProductItem && orderType !== "smm") {
            if (!selectedProductItem.active || !selectedProductItem.product) {
                return res.status(400).json({ success: false, message: "This package is not available." });
            }
            if (selectedProductItem.product.name !== orderProduct && selectedProductItem.product.slug !== String(req.body.productSlug || "")) {
                return res.status(400).json({ success: false, message: "The selected package does not match this product." });
            }
            if (quantity > selectedProductItem.stock) {
                return res.status(400).json({ success: false, message: `Only ${selectedProductItem.stock} package(s) are currently available.` });
            }
            const finalUnitPrice = selectedProductItem.discountPrice > 0 && selectedProductItem.discountPrice < selectedProductItem.price
                ? selectedProductItem.discountPrice
                : selectedProductItem.price;
            orderPackage = selectedProductItem.title;
            unitPrice = `Rs. ${finalUnitPrice}`;
            orderPrice = `Rs. ${finalUnitPrice * quantity}`;
        } else if (orderType !== "smm") {
            quantity = 1;
        }

        if (orderType === "smm") {
            const smmItem = await ProductItem.findOne({ serviceId: String(req.body.serviceId || ""), active: true });
            if (!smmItem) return res.status(400).json({ success: false, message: "SMM service is unavailable." });
            const min = Number(smmItem.minQuantity || 10);
            const max = Number(smmItem.maxQuantity || 1000000);
            if (quantity < min || quantity > max) return res.status(400).json({ success: false, message: `Quantity must be between ${min} and ${max}.` });
            const rate = Number(smmItem.price) || 0;
            unitPrice = `Rs. ${rate} per 1000`;
            orderPrice = `NPR ${Math.ceil((quantity / 1000) * rate)}`;
            orderPackage = `${quantity} ${orderProduct}`;
        }

        if (pubgOrder && !/^\d{4,20}$/.test(String(req.body.uid || "").trim())) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid PUBG Player ID."
            });
        }

        if (pubgOrder && !["eSewa", "Bank Transfer", "Kavro Credits", "Kavro Wallet"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Choose eSewa, Bank Transfer, or Kavro Credits for PUBG."
            });
        }

        if (pubgOrder && !creditPayment && !String(req.body.screenshot || "").trim()) {
            return res.status(400).json({
                success: false,
                message: "Upload your payment screenshot before placing the PUBG order."
            });
        }

        if (isFreeFireProduct(orderProduct) && !creditPayment && !String(req.body.screenshot || "").trim()) {
            return res.status(400).json({ success: false, message: "Upload your eSewa payment screenshot before placing the Free Fire order." });
        }

        if (pubgOrder && (!selectedProductItem || !selectedProductItem.providerOfferId)) {
            return res.status(503).json({
                success: false,
                message: "This PUBG package is not connected to FazerCards yet. Please contact Kavro support."
            });
        }

        if (isFreeFireProduct(orderProduct) && creditPayment && (!selectedProductItem || !String(selectedProductItem.providerProductKey || "").trim())) {
            return res.status(503).json({
                success: false,
                message: "This Free Fire package is not connected to RechargeGames yet. Please contact Kavro support."
            });
        }

        if (isFreeFireProduct(orderProduct) && !["eSewa", "Kavro Credits", "Kavro Wallet"].includes(paymentMethod)) {
            return res.status(400).json({ success: false, message: "Choose eSewa or Kavro Wallet for Free Fire." });
        }

        // Kavro Credits are internal balance. Debit them atomically before
        // creating a PUBG order so two simultaneous checkouts cannot spend
        // the same balance. The catch block refunds them if order creation
        // fails afterward.
        if (creditPayment) {
            const orderTotal = parseAmount(orderPrice);
            if (!orderTotal) {
                return res.status(400).json({
                    success: false,
                    message: "Could not calculate the PUBG order total."
                });
            }

            const updatedUser = await User.findOneAndUpdate(
                {
                    _id: linkedUser._id,
                    kavroCredits: { $gte: orderTotal }
                },
                { $inc: { kavroCredits: -orderTotal } },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(402).json({
                    success: false,
                    message: "Not enough Kavro Credits. Please load credits first."
                });
            }

            debitedCredits = orderTotal;
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

        // PUBG uses this field as optional remarks, not a payment transaction
        // identifier. Keep the legacy duplicate check for the other products.
        if (transactionId !== "" && !pubgOrder) {

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

                paymentMethod,

                transactionId:
                    transactionId,

                remarks: String(req.body.remarks || req.body.transaction || "").trim(),

                screenshot:
                    req.body.screenshot || "",

                note:
                    req.body.note || "",

                type:
                    orderType,

                serviceId: String(req.body.serviceId || "").trim(),
                targetUrl: String(req.body.targetUrl || "").trim(),
                productItemId: selectedProductItem?._id ? String(selectedProductItem._id) : "",
                providerCategoryId: selectedProductItem?.providerCategoryId || process.env.FAZER_PUBG_CATEGORY_ID || "",
                providerOfferId: selectedProductItem?.providerOfferId || "",
                creditsDebited: debitedCredits,
                status: creditPayment ? "Payment Verified" : "Pending",
                paymentVerifiedAt: creditPayment ? new Date() : null

            });


        // =================================================
        // SAVE ORDER
        // =================================================

        await order.save();

        // Wallet purchases are automatically delivered only for Free Fire.
        // Other wallet orders are recorded as payment-verified for admin handling.
        if (creditPayment && isFreeFireProduct(order.product)) {
            try {
                await submitFreeFireOrder(order);
            } catch (providerError) {
                order.providerStatus = `error: ${providerError.message}`;
                order.status = "Refund Required";
                await order.save();
                await refundCreditsIfNeeded(order, "provider_error");
                order.status = "Refunded";
                await order.save();
                return res.status(502).json({ success: false, message: "Coins were returned because RechargeGames could not accept the order." });
            }
        }


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

if (AUTOMATIC_ORDER_EMAILS_ENABLED && resend) resend.emails.send({

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
                                    Remarks
                                </strong>
                            </td>

                            <td
                                style="
                                    padding:8px 0;
                                "
                            >
                                ${order.remarks || "N/A"}
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

        if (debitedCredits && linkedUser?._id) {
            await User.findByIdAndUpdate(linkedUser._id, {
                $inc: { kavroCredits: debitedCredits }
            }).catch(() => {});
        }

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
            "Refund Required",
            "Refunded"
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

        // SMM delivery starts only after an admin manually verifies payment.
        if (requestedStatus === "Payment Verified" && order.type === "smm" && order.serviceId && order.targetUrl) {
            try {
                const provider = await addSmmOrder(order.serviceId, order.targetUrl, order.quantity);
                order.providerOrderId = String(provider.order || "");
                order.providerStatus = "submitted";
                order.status = "Processing";
                order.processingStartedAt = new Date();
                await order.save();
            } catch (providerError) {
                order.providerStatus = `error: ${providerError.message}`;
                await order.save();
                return res.status(502).json({ success: false, message: "Payment verified, but provider order could not be submitted." });
            }
        }

        // PUBG manual payments are released only after an admin verifies the
        // screenshot. The provider webhook will move the order to Completed.
        if (requestedStatus === "Payment Verified" && isPubgProduct(order.product)) {
            if (!["eSewa", "Bank Transfer"].includes(order.paymentMethod)) {
                return res.status(400).json({
                    success: false,
                    message: "Only eSewa or Bank Transfer PUBG orders need manual verification."
                });
            }

            try {
                await submitPubgOrder(order);
            } catch (providerError) {
                order.providerStatus = `error: ${providerError.message}`;
                order.status = "Refund Required";
                await order.save();
                return res.status(502).json({
                    success: false,
                    message: "Payment verified, but FazerCards could not accept this PUBG order."
                });
            }
        }

        // Free Fire eSewa orders are sent to RechargeGames after admin verification.
        if (requestedStatus === "Payment Verified" && isFreeFireProduct(order.product) && !order.providerOrderId) {
            try {
                await submitFreeFireOrder(order);
            } catch (providerError) {
                order.providerStatus = `error: ${providerError.message}`;
                order.status = "Refund Required";
                await order.save();
                return res.status(502).json({ success: false, message: "Payment verified, but RechargeGames could not accept this Free Fire order." });
            }
        }


        // =================================================
        // CUSTOMER DELIVERY EMAIL
        // =================================================

        if (
            AUTOMATIC_ORDER_EMAILS_ENABLED &&
            resend &&
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
