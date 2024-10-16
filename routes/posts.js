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
    res.status(201).json(newPost);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Error creating post" });
  }
});

// Get all blog posts
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

// Get a single blog post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "username"
    );
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Error fetching post" });
  }
});

// Update a blog post
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.author.toString() !== req.user.userId)
      return res.status(403).json({ error: "Unauthorized" });

    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Error updating post" });
  }
});

// Delete a blog post
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.author.toString() !== req.user.userId)
      return res.status(403).json({ error: "Unauthorized" });

    // Use deleteOne instead of remove
    await Post.deleteOne({ _id: req.params.id });
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("error deleting post", error);
    res.status(500).json({ error: "Error deleting post" });
  }
});

module.exports = router;
