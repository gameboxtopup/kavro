const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const productItemRoutes = require("./routes/productItemRoutes");

const app = express();

app.use(cors({
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://kavronepal.vercel.app"
    ],
    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],
    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ]
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({
    limit: "10mb",
    extended: true
}));
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/product-items", productItemRoutes);


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch((err) => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err.message);
    console.error(err);
});

app.get("/", (req, res) => {
    res.send("✅ Kavro Backend is Running...");
});

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "https://kavronepal.vercel.app"
        ],
        methods: ["GET", "POST", "PATCH"]
    }
});

app.set("io", io);

io.on("connection", (socket) => {

    console.log("🟢 Admin Connected:", socket.id);

    socket.on("disconnect", () => {

        console.log("🔴 Admin Disconnected");

    });

});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

    console.log(`🚀 Server running on http://localhost:${PORT}`);

});