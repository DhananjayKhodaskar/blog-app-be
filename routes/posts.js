const express = require("express");
const Post = require("../models/Post");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

// Create a new blog post
router.post("/", authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  try {
    const newPost = new Post({ title, content, author: req.user.userId });
    await newPost.save();
    res.status(201).json(newPost); // Respond with the created post
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Error creating post" });
  }
});

// Get all blog posts with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const posts = await Post.find()
      .populate("author", "username")
      .skip(startIndex)
      .limit(limit);

    const totalPosts = await Post.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);
    const hasNextPage = page < totalPages;

    res.json({
      currentPage: page,
      totalPages,
      totalPosts,
      postsPerPage: limit,
      hasNextPage,
      posts,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching posts" });
  }
});

// Get a single blog post by ID
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username")
      .populate("comments.author", "username");
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post); // Respond with the found post
  } catch (error) {
    res.status(500).json({ error: "Error fetching post" });
  }
});

// Update a blog post by ID
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.author.toString() !== req.user.userId)
      return res.status(403).json({ error: "Unauthorized" });

    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;
    await post.save();
    res.json(post); // Respond with the updated post
  } catch (error) {
    res.status(500).json({ error: "Error updating post" });
  }
});

// Delete a blog post by ID
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.author.toString() !== req.user.userId)
      return res.status(403).json({ error: "Unauthorized" });

    await Post.deleteOne({ _id: req.params.id }); // Delete the post
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("error deleting post", error);
    res.status(500).json({ error: "Error deleting post" });
  }
});

// Like/Unlike a blog post
router.post("/:id/toggle-like", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userId = req.user.userId;
    const isPostLiked = post.likes.includes(userId);

    if (isPostLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId); // Unlike the post
      await post.save();
      return res.status(200).json({ message: "Post unliked successfully" });
    } else {
      post.likes.push(userId); // Like the post
      await post.save();
      return res.json({ message: "Post liked successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error toggling like on post" });
  }
});

// Add a comment to a blog post
router.post("/:id/comments", authenticateToken, async (req, res) => {
  try {
    const { content } = req.body; // Extract comment content
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const newComment = { content, author: req.user.userId }; // Create new comment
    post.comments.push(newComment); // Add comment to the post
    await post.save();

    res
      .status(201)
      .json({ message: "Comment added successfully", comment: newComment });
  } catch (error) {
    console.log("Error adding comment", error);
    res.status(500).json({ error: "Error adding comment" });
  }
});

module.exports = router;
