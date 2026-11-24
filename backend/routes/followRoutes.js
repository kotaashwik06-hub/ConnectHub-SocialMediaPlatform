
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Follow = require("../models/Follow");
const User = require("../models/User");
const Notification = require("../models/Notification");

const router = express.Router();

// VERIFY LOGIN TOKEN
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

// GET FOLLOWERS, FOLLOWING AND FOLLOW STATUS
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const targetUserId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        const targetUser = await User.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const followersCount = await Follow.countDocuments({
            following: targetUserId
        });

        const followingCount = await Follow.countDocuments({
            follower: targetUserId
        });

        const existingFollow = await Follow.findOne({
            follower: req.userId,
            following: targetUserId
        });

        res.json({
            followersCount,
            followingCount,
            isFollowing: !!existingFollow
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to get follow details.",
            error: error.message
        });
    }
});

// FOLLOW USER AND CREATE NOTIFICATION
router.post("/:id/follow", verifyToken, async (req, res) => {
    try {
        const targetUserId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        if (req.userId.toString() === targetUserId.toString()) {
            return res.status(400).json({
                message: "You cannot follow yourself."
            });
        }

        const targetUser = await User.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const existingFollow = await Follow.findOne({
            follower: req.userId,
            following: targetUserId
        });

        if (existingFollow) {
            return res.status(400).json({
                message: "You are already following this user."
            });
        }

        await Follow.create({
            follower: req.userId,
            following: targetUserId
        });

        const sender = await User.findById(req.userId).select("username");

        await Notification.create({
            recipient: targetUserId,
            sender: req.userId,
            type: "follow",
            message: `${sender.username} started following you!`
        });

        res.status(201).json({
            message: "User followed successfully!"
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "You are already following this user."
            });
        }

        res.status(500).json({
            message: "Failed to follow user.",
            error: error.message
        });
    }
});

// UNFOLLOW USER
router.delete("/:id/follow", verifyToken, async (req, res) => {
    try {
        const targetUserId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        const result = await Follow.findOneAndDelete({
            follower: req.userId,
            following: targetUserId
        });

        if (!result) {
            return res.status(404).json({
                message: "You are not following this user."
            });
        }

        res.json({
            message: "User unfollowed successfully!"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to unfollow user.",
            error: error.message
        });
    }
});

module.exports = router;
