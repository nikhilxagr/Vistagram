import uploadOnCloudinary from "../utils/cloudinary.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

export const uploadReel = async (req, res) => {
  try {
    const { caption } = req.body;
    let media;
    if (req.file) {
      media = await uploadOnCloudinary(req.file.path);
    } else {
      return res.status(400).json({ message: "media is required" });
    }
    const reel = await Post.create({
      caption,
      media: media.secure_url,
      author: req.user._id,
    });
    const user = await User.findById(req.user._id);
    user.reels.push(reel._id);
    await user.save();

    const populatedReel = await Post.findById(reel._id).populate(
      "author",
      "name username profileImage",
    );
    return res.status(201).json(populatedReel);
  } catch (error) {
    return res.status(500).json({ message: "Error uploading reel", error });
  }
};

export const like = async (req, res) => {
  try {
    const reelId = req.params.id;
    const reel = await Post.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: "Reel not found" });
    }

    const alreadyLiked = reel.likes.some(
      (id) => id.toString() === req.user._id.toString(),
    );
    if (alreadyLiked) {
      reel.likes = reel.likes.filter(
        (id) => id.toString() !== req.user._id.toString(),
      );
    } else {
      reel.likes.push(req.user._id);
    }
    await reel.save();
    return res.status(200).json({
      message: "Reel liked/unliked successfully",
      likesCount: reel.likes.length,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error liking reel", error });
  }
};

export const comments = async (req, res) => {
  try {
    const { message } = req.body;
    const reelId = req.params.id;
    const reel = await Post.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: "Reel not found" });
    }
    reel.comments.push({
      author: req.user._id,
      message,
    });
    await reel.save();
    reel.populate("comments.author", "name username profileImage");
    reel.populate("author", "name username profileImage");

    return res.status(200).json({
      message: "Comment added successfully",
      commentsCount: post.comments.length,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error adding comment", error });
  }
};

export const getAllReels = async (req, res) => {
  try {
    const reels = await Reel.find({})
      .populate("author", "name username profileImage")
      .populate("comments.author", "name username profileImage");
    return res.status(200).json(reels);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching all reels", error });
  }
};