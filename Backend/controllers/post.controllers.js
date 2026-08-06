import uploadOnCloudinary from "../config/cloudinary.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import fs from "fs";

export const uploadPost = async (req, res) => {
  try {
    const { caption, mediaType } = req.body;
    let mediaUrl;

    if (req.file) {
      try {
        const uploaded = await uploadOnCloudinary(req.file.path);
        mediaUrl = typeof uploaded === "string" ? uploaded : uploaded?.secure_url;
      } catch (err) {
        console.error("Cloudinary failed, using local base64 fallback:", err);
        const fileData = fs.readFileSync(req.file.path);
        const mimeType = req.file.mimetype || "image/png";
        mediaUrl = `data:${mimeType};base64,${fileData.toString("base64")}`;
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
    } else {
      return res.status(400).json({ message: "Media file is required" });
    }

    const userId = req.userId || req.user?._id;

    const post = await Post.create({
      caption,
      media: mediaUrl,
      mediaType: mediaType || "image",
      author: userId,
    });

    const user = await User.findById(userId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "name username profileImage"
    );

    return res.status(201).json({ message: "Post uploaded successfully", post: populatedPost });
  } catch (error) {
    console.error("Error in uploadPost:", error);
    return res.status(500).json({ message: "Error uploading post", error: error.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("author", "name username profileImage")
      .populate({
        path: "comments.author",
        select: "name username profileImage",
      })
      .sort({ createdAt: -1 });
    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching all posts", error: error.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name username profileImage")
      .populate({
        path: "comments.author",
        select: "name username profileImage",
      });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching post", error: error.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId || req.user?._id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());
    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }
    await post.save();
    return res.status(200).json({ message: "Post liked/unliked successfully", likesCount: post.likes.length });
  } catch (error) {
    return res.status(500).json({ message: "Error liking post", error: error.message });
  }
};

export const comments = async (req, res) => {
  try {
    const { message } = req.body;
    const postId = req.params.id;
    const userId = req.userId || req.user?._id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    post.comments.push({
      author: userId,
      message,
    });
    await post.save();

    const updatedPost = await Post.findById(postId).populate({
      path: "comments.author",
      select: "name username profileImage",
    });

    return res.status(200).json({
      message: "Comment added successfully",
      comments: updatedPost.comments,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error adding comment", error: error.message });
  }
};

export const saved = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id;
    const userId = req.userId || req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    user.savedPosts = user.savedPosts || [];
    const alreadySaved = user.savedPosts.some(
      (id) => id.toString() === postId.toString()
    );

    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter(
        (id) => id.toString() !== postId.toString()
      );
    } else {
      user.savedPosts.push(postId);
    }

    await user.save();
    
    const updatedUser = await User.findById(userId).populate({
      path: "savedPosts",
      populate: { path: "author", select: "name username profileImage" }
    });

    return res.status(200).json({
      message: alreadySaved ? "Post unsaved" : "Post saved",
      isSaved: !alreadySaved,
      savedPosts: updatedUser.savedPosts,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error saving post", error: error.message });
  }
};