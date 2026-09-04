const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// ======================================
// CREATE ADMIN
// ======================================

exports.createAdmin = async (req, res) => {

    try {

        const adminCount = await Admin.countDocuments();
        const suppliedSecret = req.headers["x-admin-setup-secret"];

        if (
            adminCount > 0 &&
            (!process.env.ADMIN_REGISTRATION_SECRET ||
                suppliedSecret !== process.env.ADMIN_REGISTRATION_SECRET)
        ) {
            return res.status(403).json({
                success: false,
                message: "Admin registration is closed."
            });
        }

        const { username, password } = req.body;

        const exists = await Admin.findOne({ username });

        if (exists) {

            return res.status(400).json({
                success: false,
                message: "Admin already exists."
            });

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = new Admin({

            username,
            password: hashedPassword

        });

        await admin.save();

        res.status(201).json({

            success: true,
            message: "Admin created successfully."

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

};

// ======================================
// LOGIN ADMIN
// ======================================

exports.loginAdmin = async (req, res) => {

    try {

        const { username, password } = req.body;

        const admin = await Admin.findOne({ username });

        if (!admin) {

            return res.status(401).json({

                success: false,
                message: "Invalid username or password."

            });

        }

        const match = await bcrypt.compare(password, admin.password);

        if (!match) {

            return res.status(401).json({

                success: false,
                message: "Invalid username or password."

            });

        }

        const token = jwt.sign(

            { id: admin._id, role: "admin" },

            process.env.JWT_SECRET,

            { expiresIn: "7d" }

        );

        res.json({

            success: true,
            token

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

};

// ======================================
// CHANGE PASSWORD
// ======================================

exports.changePassword = async (req, res) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({

                success: false,
                message: "Unauthorized"

            });

        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const admin = await Admin.findById(decoded.id);

        if (!admin) {

            return res.status(404).json({

                success: false,
                message: "Admin not found."

            });

        }

        const {

            currentPassword,
            newPassword

        } = req.body;

        const isMatch = await bcrypt.compare(

            currentPassword,
            admin.password

        );

        if (!isMatch) {

            return res.status(400).json({

                success: false,
                message: "Current password is incorrect."

            });

        }

        if (newPassword.length < 8) {

            return res.status(400).json({

                success: false,
                message: "Password must be at least 8 characters."

            });

        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        admin.password = hashedPassword;

        await admin.save();

        res.json({

            success: true,
            message: "Password changed successfully."

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

};
