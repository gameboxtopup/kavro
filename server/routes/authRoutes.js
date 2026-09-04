const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");

const router = express.Router();

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);


// =========================================
// EMAIL TRANSPORTER
// =========================================

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


// =========================================
// CREATE JWT
// =========================================

function createToken(user) {

    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: "user"
        },

        process.env.JWT_SECRET,

        {
            expiresIn: "30d"
        }
    );
}


// =========================================
// REGISTER
// =========================================

router.post("/register", async (req, res) => {

    try {

        const name =
            (req.body.name || "").trim();

        const email =
            (req.body.email || "").trim().toLowerCase();

        const password =
            req.body.password || "";


        if (!name || !email || !password) {

            return res.status(400).json({
                success: false,
                message: "Name, email and password are required."
            });

        }


        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });

        }


        const existingUser =
            await User.findOne({ email });


        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });

        }


        const hashedPassword =
            await bcrypt.hash(password, 12);


        const user =
            await User.create({

                name,

                email,

                password: hashedPassword

            });


        const token =
            createToken(user);


        return res.status(201).json({

            success: true,

            message: "Account created successfully.",

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                avatar: user.avatar

            }

        });

    }

    catch (err) {

        console.error(
            "REGISTER ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to create account."

        });

    }

});


// =========================================
// LOGIN
// =========================================

router.post("/login", async (req, res) => {

    try {

        const email =
            (req.body.email || "").trim().toLowerCase();

        const password =
            req.body.password || "";


        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required."

            });

        }


        const user =
            await User.findOne({ email });


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }


        if (!user.password) {

            return res.status(401).json({

                success: false,

                message:
                    "This account uses Google login. Please continue with Google."

            });

        }


        const passwordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordCorrect) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }


        const token =
            createToken(user);


        return res.json({

            success: true,

            message:
                "Login successful.",

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                avatar: user.avatar

            }

        });

    }

    catch (err) {

        console.error(
            "LOGIN ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                "Login failed."

        });

    }

});


// =========================================
// GOOGLE LOGIN
// =========================================

router.post("/google", async (req, res) => {

    try {

        const credential =
            req.body.credential || "";

        if (!credential) {

            return res.status(400).json({
                success: false,
                message: "Google credential is required."
            });

        }

        // Verify Google's ID token
        const ticket =
            await googleClient.verifyIdToken({
                idToken: credential,
                audience:
                    process.env.GOOGLE_CLIENT_ID
            });

        const payload =
            ticket.getPayload();

        if (!payload) {

            return res.status(401).json({
                success: false,
                message: "Invalid Google account."
            });

        }

        const googleId =
            payload.sub;

        const email =
            (payload.email || "")
                .trim()
                .toLowerCase();

        const name =
            payload.name ||
            "Kavro User";

        const avatar =
            payload.picture ||
            "";

        if (!googleId || !email) {

            return res.status(400).json({
                success: false,
                message:
                    "Google account information is incomplete."
            });

        }

        // Find by Google ID first
        let user =
            await User.findOne({
                googleId
            });

        // If not found, try email
        if (!user) {

            user =
                await User.findOne({
                    email
                });

        }

        // Create new account
        if (!user) {

            user =
                await User.create({

                    name,

                    email,

                    password: "",

                    googleId,

                    avatar

                });

        }

        // Existing account
        else {

            let changed = false;

            if (!user.googleId) {

                user.googleId =
                    googleId;

                changed = true;

            }

            if (!user.avatar && avatar) {

                user.avatar =
                    avatar;

                changed = true;

            }

            if (!user.name && name) {

                user.name =
                    name;

                changed = true;

            }

            if (changed) {

                await user.save();

            }

        }

        const token =
            createToken(user);

        return res.json({

            success: true,

            message:
                "Google login successful.",

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                avatar: user.avatar

            }

        });

    }

    catch (err) {

        console.error(
            "GOOGLE LOGIN ERROR:",
            err
        );

        return res.status(401).json({

            success: false,

            message:
                "Google authentication failed."

        });

    }

});

// =========================================
// GET CURRENT USER
// =========================================

router.get("/me", async (req, res) => {

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
            ).select("-password -resetPasswordToken -resetPasswordExpires");


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        return res.json({

            success: true,

            user

        });

    }

    catch (err) {

        return res.status(401).json({

            success: false,

            message:
                "Invalid or expired token."

        });

    }

});


// =========================================
// FORGOT PASSWORD
// =========================================

router.post("/forgot-password", async (req, res) => {

    try {

        const email =
            (req.body.email || "").trim().toLowerCase();


        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter your email."

            });

        }


        const user =
            await User.findOne({ email });


        // Don't reveal whether an account exists
        if (!user) {

            return res.json({

                success: true,

                message:
                    "If an account exists, a password reset email has been sent."

            });

        }


        const resetToken =
            crypto.randomBytes(32).toString("hex");


        user.resetPasswordToken =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");


        user.resetPasswordExpires =
            Date.now() + 15 * 60 * 1000;


        await user.save();


        const frontendUrl =
            process.env.FRONTEND_URL ||
            "https://kavronepal.vercel.app";


        const resetLink =
            `${frontendUrl}/reset-password.html?token=${resetToken}`;


        await transporter.sendMail({

            from:
                `"Kavro Nepal" <${process.env.EMAIL_USER}>`,

            to:
                user.email,

            subject:
                "Reset your Kavro password",

            text:
                `Reset your Kavro password: ${resetLink}`,

            html: `

                <div style="
                    font-family:Arial,sans-serif;
                    max-width:600px;
                    margin:auto;
                    padding:30px;
                ">

                    <h2>
                        Reset your Kavro password
                    </h2>

                    <p>
                        Hello ${user.name},
                    </p>

                    <p>
                        We received a request to reset
                        your Kavro password.
                    </p>

                    <p>
                        <a
                            href="${resetLink}"
                            style="
                                display:inline-block;
                                padding:12px 20px;
                                background:#2563eb;
                                color:white;
                                text-decoration:none;
                                border-radius:8px;
                            "
                        >
                            Reset Password
                        </a>
                    </p>

                    <p>
                        This link expires in 15 minutes.
                    </p>

                    <p>
                        If you didn't request this,
                        you can safely ignore this email.
                    </p>

                </div>

            `

        });


        return res.json({

            success: true,

            message:
                "If an account exists, a password reset email has been sent."

        });

    }

    catch (err) {

        console.error(
            "FORGOT PASSWORD ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                "Could not send reset email."

        });

    }

});


// =========================================
// RESET PASSWORD
// =========================================

router.post("/reset-password", async (req, res) => {

    try {

        const token =
            req.body.token || "";

        const password =
            req.body.password || "";


        if (!token || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Token and new password are required."

            });

        }


        if (password.length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must be at least 6 characters."

            });

        }


        const hashedToken =
            crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");


        const user =
            await User.findOne({

                resetPasswordToken:
                    hashedToken,

                resetPasswordExpires:
                    {
                        $gt: new Date()
                    }

            });


        if (!user) {

            return res.status(400).json({

                success: false,

                message:
                    "Reset link is invalid or expired."

            });

        }


        user.password =
            await bcrypt.hash(
                password,
                12
            );


        user.resetPasswordToken = "";

        user.resetPasswordExpires = null;


        await user.save();


        return res.json({

            success: true,

            message:
                "Password reset successfully."

        });

    }

    catch (err) {

        console.error(
            "RESET PASSWORD ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                "Could not reset password."

        });

    }

});


module.exports = router;
