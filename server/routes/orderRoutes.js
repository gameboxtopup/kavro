const express = require("express");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");

const router = express.Router();

const Order = require("../models/Order");
const User = require("../models/User");
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


// =====================================================
// CREATE NEW ORDER
// =====================================================

router.post("/", async (req, res) => {

    try {

        const orderType =
            req.body.type || "game";

        const transactionId =
            (req.body.transactionId || "").trim();

        const uid =
            (req.body.uid || "").trim();

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

                product:
                    req.body.product,

                package:
                    req.body.package,

                price:
                    req.body.price,

                uid,

                playerName,

                playerRegion,

                uidVerifiedAt,

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

        resend.emails.send({

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

                email:
                    user.email

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


        const order =
            await Order.findByIdAndUpdate(

                req.params.id,

                {

                    status:
                        req.body.status

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
            req.body.status === "Delivered" &&
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
                    "Your Kavro Order Has Been Delivered!",

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
                            Your Order Has Been Delivered
                        </h2>


                        <p>
                            Hello,
                        </p>


                        <p>
                            Your Kavro order has been successfully delivered.
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
