
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const router = express.Router();

// VERIFY LOGIN
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }
}

// GET MY NOTIFICATIONS
router.get("/", verifyToken, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.userId
        })
        .populate("sender", "username")
        .sort({ createdAt: -1 });

        const unreadCount = await Notification.countDocuments({
            recipient: req.userId,
            isRead: false
        });

        res.json({
            message: "Notifications fetched successfully!",
            notifications,
            unreadCount
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch notifications.",
            error: error.message
        });
    }
});

// MARK ONE NOTIFICATION AS READ
router.put("/:id/read", verifyToken, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid notification ID."
            });
        }

        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.userId
            },
            {
                isRead: true
            },
            {
                new: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found."
            });
        }

        res.json({
            message: "Notification marked as read!",
            notification
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update notification.",
            error: error.message
        });
    }
});

// MARK ALL NOTIFICATIONS AS READ
router.put("/read-all", verifyToken, async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.userId,
                isRead: false
            },
            {
                isRead: true
            }
        );

        res.json({
            message: "All notifications marked as read!"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update notifications.",
            error: error.message
        });
    }
});

module.exports = router;
