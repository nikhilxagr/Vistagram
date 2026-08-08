import uploadOnCloudinary from "../config/cloudinary.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import fs from "fs";

export const uploadReel = async (req, res) => {
  try {
    const { caption } = req.body;
    let mediaUrl;

    if (req.file) {
      try {
        const uploaded = await uploadOnCloudinary(req.file.path);
        mediaUrl = typeof uploaded === "string" ? uploaded : uploaded?.secure_url;
      } catch (err) {
        console.error("Cloudinary failed, using local base64 fallback:", err);
        const fileData = fs.readFileSync(req.file.path);
        const mimeType = req.file.mimetype || "video/mp4";
        mediaUrl = `data:${mimeType};base64,${fileData.toString("base64")}`;
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
    } else {
      return res.status(400).json({ message: "Media file is required" });
    }

    const userId = req.userId || req.user?._id;

    const reel = await Post.create({
      caption,
      media: mediaUrl,
      mediaType: "video",
      author: userId,
    });

    const user = await User.findById(userId);
    if (user) {
      user.reels = user.reels || [];
      user.reels.push(reel._id);
      await user.save();
    }

    const populatedReel = await Post.findById(reel._id).populate(
      "author",
      "name username profileImage"
    );
    return res.status(201).json({ message: "Reel uploaded successfully", reel: populatedReel });
  } catch (error) {
    console.error("Error in uploadReel:", error);
    return res.status(500).json({ message: "Error uploading reel", error: error.message });
  }
};

export const like = async (req, res) => {
  try {
    const reelId = req.params.id;
    const userId = req.userId || req.user?._id;
    const reel = await Post.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: "Reel not found" });
    }

    const alreadyLiked = reel.likes?.some(
      (id) => id.toString() === userId.toString()
    );
    if (alreadyLiked) {
      reel.likes = reel.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      reel.likes = reel.likes || [];
      reel.likes.push(userId);
    }
    await reel.save();
    return res.status(200).json({
      message: "Reel liked/unliked successfully",
      likesCount: reel.likes.length,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error liking reel", error: error.message });
  }
};

export const comments = async (req, res) => {
  try {
    const { message } = req.body;
    const reelId = req.params.id;
    const userId = req.userId || req.user?._id;
    const reel = await Post.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: "Reel not found" });
    }
    reel.comments = reel.comments || [];
    reel.comments.push({
      author: userId,
      message,
    });
    await reel.save();

    const updatedReel = await Post.findById(reelId).populate({
      path: "comments.author",
      select: "name username profileImage",
    });

    return res.status(200).json({
      message: "Comment added successfully",
      commentsCount: updatedReel.comments.length,
      comments: updatedReel.comments,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error adding comment", error: error.message });
  }
};

export const getAllReels = async (req, res) => {
  try {
    const reels = await Post.find({ mediaType: "video" })
      .populate("author", "name username profileImage")
      .populate({
        path: "comments.author",
        select: "name username profileImage",
      })
      .sort({ createdAt: -1 });
    return res.status(200).json(reels);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching reels", error: error.message });
  }
};