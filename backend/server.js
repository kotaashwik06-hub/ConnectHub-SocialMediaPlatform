
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// IMPORT ROUTES
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const followRoutes = require("./routes/followRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// HOME ROUTE
app.get("/", (req, res) => {
    res.send("ConnectHub Backend is Running!");
});

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/notifications", notificationRoutes);

// CONNECT TO MONGODB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully!");

        const PORT = process.env.PORT || 5001;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB Connection Error:", error.message);
    });
