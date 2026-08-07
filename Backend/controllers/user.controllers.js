import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Reel from "../models/reel.model.js";
import Story from "../models/story.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import fs from "fs";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const user = await User.findById(userId)
      .select("-password")
      .populate("followers", "name username profileImage")
      .populate("following", "name username profileImage")
      .populate("posts")
      .populate({
        path: "savedPosts",
        populate: { path: "author", select: "name username profileImage" },
      })
      .populate("reels");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    res.status(500).json({ message: "Current user not found" });
  }
};

export const suggestedUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.userId },
    }).select("-password");

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error in suggestedUsers:", error);
    res.status(500).json({ message: "Failed to fetch suggested users" });
  }
};

export const editProfile = async (req, res) => {
  try {
    const { name, username, bio, profession, gender } = req.body;
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username) {
      const sameUserWithUsername = await User.findOne({ username }).select("-password");
      if (sameUserWithUsername && sameUserWithUsername._id.toString() !== req.userId) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    if (req.file) {
      try {
        const uploadedUrl = await uploadOnCloudinary(req.file.path);
        if (typeof uploadedUrl === "string") {
          user.profileImage = uploadedUrl;
        } else if (uploadedUrl?.secure_url) {
          user.profileImage = uploadedUrl.secure_url;
        }
      } catch (uploadError) {
        console.error("Cloudinary upload error, using local base64 fallback:", uploadError.message);
        try {
          const fileData = fs.readFileSync(req.file.path);
          const mimeType = req.file.mimetype || "image/png";
          user.profileImage = `data:${mimeType};base64,${fileData.toString("base64")}`;
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (fsErr) {
          console.error("Local file fallback error:", fsErr);
        }
      }
    }

    user.name = name || user.name;
    user.username = username || user.username;
    user.bio = bio !== undefined ? bio : user.bio;
    user.profession = profession !== undefined ? profession : user.profession;

    if (gender) {
      if (["Male", "Female", "Other"].includes(gender)) {
        user.gender = gender;
      } else {
        user.gender = "Other";
      }
    }

    await user.save();
    return res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error in editProfile controller:", error);
    res.status(500).json({ message: error.message || "Failed to edit profile" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userName = req.params.userName;
    if (!userName) {
      return res.status(400).json({ message: "Username is required" });
    }

    let user = null;

    if (userName.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(userName)
        .select("-password")
        .populate("followers", "name username profileImage")
        .populate("following", "name username profileImage")
        .populate("posts")
        .populate({
          path: "savedPosts",
          populate: { path: "author", select: "name username profileImage" },
        })
        .populate("reels");
    }

    if (!user) {
      const escaped = userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      user = await User.findOne({
        $or: [
          { username: { $regex: new RegExp(`^${escaped}$`, "i") } },
          { name: { $regex: new RegExp(`^${escaped}$`, "i") } },
          { email: { $regex: new RegExp(`^${escaped}$`, "i") } },
        ],
      })
        .select("-password")
        .populate("followers", "name username profileImage")
        .populate("following", "name username profileImage")
        .populate("posts")
        .populate({
          path: "savedPosts",
          populate: { path: "author", select: "name username profileImage" },
        })
        .populate("reels");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

export const followUser = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId
    );

    if (alreadyFollowing) {
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId
      );
      await Promise.all([currentUser.save(), targetUser.save()]);
      return res.status(200).json({
        message: "Unfollowed successfully",
        isFollowing: false,
        followersCount: targetUser.followers.length,
        followers: targetUser.followers,
      });
    } else {
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      await Promise.all([currentUser.save(), targetUser.save()]);
      return res.status(200).json({
        message: "Followed successfully",
        isFollowing: true,
        followersCount: targetUser.followers.length,
        followers: targetUser.followers,
      });
    }
  } catch (error) {
    console.error("Error in followUser:", error);
    res.status(500).json({ message: "Failed to follow/unfollow user" });
  }
};