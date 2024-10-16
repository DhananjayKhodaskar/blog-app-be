// post.model.js
const mongoose = require("mongoose");
const CommentSchema = require("./Comment");

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [CommentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", PostSchema);
