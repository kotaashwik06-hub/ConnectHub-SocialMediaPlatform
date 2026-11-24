
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

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

// SEARCH USERS BY USERNAME
router.get("/search/:username", verifyToken, async (req, res) => {
    try {
        const username = req.params.username.trim();

        if (username.length < 2) {
            return res.status(400).json({
                message: "Enter at least 2 characters."
            });
        }

        const safeUsername = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const users = await User.find({
            username: {
                $regex: safeUsername,
                $options: "i"
            }
        }).select("username profilePicture");

        res.json({
            message: "Users found successfully!",
            users: users.map(user => ({
                _id: user._id,
                username: user.username,
                profilePicture: user.profilePicture || ""
            }))
        });

    } catch (error) {
        res.status(500).json({
            message: "User search failed.",
            error: error.message
        });
    }
});

// UPDATE MY PROFILE
router.put("/profile/update", verifyToken, async (req, res) => {
    try {
        const { bio, profilePicture } = req.body;

        if (
            bio !== undefined &&
            (typeof bio !== "string" || bio.length > 200)
        ) {
            return res.status(400).json({
                message: "Bio must be text with a maximum of 200 characters."
            });
        }

        if (
            profilePicture !== undefined &&
            typeof profilePicture !== "string"
        ) {
            return res.status(400).json({
                message: "Profile picture must be a URL string."
            });
        }

        const updates = {};

        if (bio !== undefined) updates.bio = bio.trim();

        if (profilePicture !== undefined) {
            updates.profilePicture = profilePicture.trim();
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("username email bio profilePicture");

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.json({
            message: "Profile updated successfully!",
            user
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update profile.",
            error: error.message
        });
    }
});

// GET USER PROFILE
router.get("/:id", verifyToken, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        const user = await User.findById(req.params.id)
            .select("username email bio profilePicture");

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const profile = {
            id: user._id,
            username: user.username,
            bio: user.bio || "",
            profilePicture: user.profilePicture || ""
        };

        // Show email only to account owner
        if (user._id.toString() === req.userId) {
            profile.email = user.email;
        }

        res.json({
            message: "Profile fetched successfully!",
            user: profile
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to load profile.",
            error: error.message
        });
    }
});

module.exports = router;
