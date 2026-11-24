
const express = require("express");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const User = require("../models/User");

const router = express.Router();

// VERIFY USER LOGIN
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access denied. Please login."
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

// GET ALL POSTS
router.get("/", verifyToken, async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .sort({ createdAt: -1 });

        res.json({
            message: "Posts fetched successfully!",
            posts
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch posts.",
            error: error.message
        });
    }
});

// CREATE A NEW POST WITH IMAGE SUPPORT
router.post("/", verifyToken, async (req, res) => {
    try {
        const { content, image } = req.body;

        if (
            (!content || !content.trim()) &&
            (!image || !image.trim())
        ) {
            return res.status(400).json({
                message: "Please enter text or select an image."
            });
        }

        if (image && image.length > 7 * 1024 * 1024) {
            return res.status(413).json({
                message: "Image is too large. Maximum size is 5 MB."
            });
        }

        const newPost = await Post.create({
            user: req.userId,
            content: content ? content.trim() : "",
            image: image ? image.trim() : ""
        });

        await newPost.populate("user", "username profilePicture");

        res.status(201).json({
            message: "Post created successfully!",
            post: newPost
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create post.",
            error: error.message
        });
    }
});

// LIKE AND UNLIKE A POST
router.post("/:id/like", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found."
            });
        }

        const alreadyLiked = post.likes.some(
            id => id.toString() === req.userId.toString()
        );

        if (alreadyLiked) {
            post.likes = post.likes.filter(
                id => id.toString() !== req.userId.toString()
            );

            await post.save();

            return res.json({
                message: "Post unliked successfully!",
                likes: post.likes.length,
                liked: false
            });
        }

        post.likes.push(req.userId);
        await post.save();

        // CREATE NOTIFICATION FOR POST OWNER
        if (post.user.toString() !== req.userId.toString()) {
            const existingNotification = await Notification.findOne({
                recipient: post.user,
                sender: req.userId,
                type: "like",
                post: post._id
            });

            if (!existingNotification) {
                const sender = await User.findById(req.userId)
                    .select("username");

                await Notification.create({
                    recipient: post.user,
                    sender: req.userId,
                    type: "like",
                    post: post._id,
                    message: `${sender.username} liked your post!`
                });
            }
        }

        res.json({
            message: "Post liked successfully!",
            likes: post.likes.length,
            liked: true
        });

    } catch (error) {
        res.status(500).json({
            message: "Like operation failed.",
            error: error.message
        });
    }
});

// ADD A COMMENT
router.post("/:id/comments", verifyToken, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: "Comment cannot be empty."
            });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found."
            });
        }

        post.comments.push({
            user: req.userId,
            text: text.trim()
        });

        await post.save();

        await post.populate("comments.user", "username profilePicture");

        // CREATE COMMENT NOTIFICATION
        if (post.user.toString() !== req.userId.toString()) {
            const sender = await User.findById(req.userId)
                .select("username");

            await Notification.create({
                recipient: post.user,
                sender: req.userId,
                type: "comment",
                post: post._id,
                message: `${sender.username} commented on your post!`
            });
        }

        res.status(201).json({
            message: "Comment added successfully!",
            comments: post.comments
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to add comment.",
            error: error.message
        });
    }
});

// DELETE OWN POST
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found."
            });
        }

        if (post.user.toString() !== req.userId.toString()) {
            return res.status(403).json({
                message: "You can only delete your own posts."
            });
        }

        await Notification.deleteMany({ post: post._id });
        await Post.findByIdAndDelete(req.params.id);

        res.json({
            message: "Post deleted successfully!"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete post.",
            error: error.message
        });
    }
});

// EDIT OWN POST
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const { content } = req.body;

        if (typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                message: "Post content cannot be empty."
            });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found."
            });
        }

        if (post.user.toString() !== req.userId.toString()) {
            return res.status(403).json({
                message: "You can only edit your own posts."
            });
        }

        post.content = content.trim();
        await post.save();

        res.json({
            message: "Post updated successfully!",
            post
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update post.",
            error: error.message
        });
    }
});

module.exports = router;
