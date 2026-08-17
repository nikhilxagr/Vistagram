import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Reel from "../models/reel.model.js";
import Story from "../models/story.model.js";
import Notification from "../models/notification.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import fs from "fs";
import { io, getReceiverSocketId } from "../socket.js";


export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const user = await User.findById(userId)
      .select("-password")
      .populate("followers", "name username profileImage")
      .populate("following", "name username profileImage")
      .populate({
        path: "posts",
        populate: { path: "author", select: "name username profileImage" },
      })
      .populate({
        path: "savedPosts",
        populate: { path: "author", select: "name username profileImage" },
      })
      .populate({
        path: "reels",
        populate: { path: "author", select: "name username profileImage" },
      });
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
      const uploadedUrl = await uploadOnCloudinary(req.file.path);
      if (typeof uploadedUrl === "string") {
        user.profileImage = uploadedUrl;
      } else if (uploadedUrl?.secure_url) {
        user.profileImage = uploadedUrl.secure_url;
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

    const populateConfig = [
      { path: "followers", select: "name username profileImage" },
      { path: "following", select: "name username profileImage" },
      {
        path: "posts",
        populate: { path: "author", select: "name username profileImage" },
      },
      {
        path: "savedPosts",
        populate: { path: "author", select: "name username profileImage" },
      },
      {
        path: "reels",
        populate: { path: "author", select: "name username profileImage" },
      },
    ];

    if (userName.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(userName)
        .select("-password")
        .populate(populateConfig);
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
        .populate(populateConfig);
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
         if (currentUser._id.toString() !== targetUser._id.toString()) {
           const notification = await Notification.create({
             sender: currentUser._id,
             receiver: targetUser._id,
             type: "follow",
             message: `${currentUser.name} started following you.`,
           });

           const populatedNotification = await Notification.findById(
             notification._id,
           ).populate("sender receiver", "name username profileImage");

           const receiverSocketId = getReceiverSocketId(targetUser._id.toString());
           if (receiverSocketId) {
             io.to(receiverSocketId).emit(
               "newNotification",
               populatedNotification,
             );
           }
         }
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

export const followingList = async (req, res) => {
  try {
    const result = await User.findById(req.userId)
      .select("following")
      .populate("following", "name username profileImage");
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ following: result.following });
  } catch (error) {
    console.error("Error in followingList:", error);
    res.status(500).json({ message: "Failed to fetch following list" });
  }
};

export const search = async (req, res) => {
  try {
   const keyword = req.query.keyword || "";
    if (!keyword) {
      return res.status(400).json({ message: "Search keyword is required" });
    }

    const escapedQuery = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const users = await User.find({
      $or: [
        { username: { $regex: new RegExp(escapedQuery, "i") } },
        { name: { $regex: new RegExp(escapedQuery, "i") } },
        { email: { $regex: new RegExp(escapedQuery, "i") } },
      ],
    }).select("-password");

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error in search:", error);
    res.status(500).json({ message: "Failed to search users" });
  }
};

export const getAllNotifications = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const rawNotifications = await Notification.find({ receiver: userId })
      .populate("sender", "name username profileImage")
      .populate("post", "media mediaType caption")
      .populate("reel", "media caption")
      .populate("story", "media mediaType")
      .sort({ createdAt: -1 });

    const seen = new Set();
    const notifications = [];
    const duplicateIdsToDelete = [];

    for (const notif of rawNotifications) {
      const senderId = (notif.sender?._id || notif.sender || "").toString();
      const targetId = (
        notif.post?._id || notif.post ||
        notif.reel?._id || notif.reel ||
        notif.story?._id || notif.story ||
        ""
      ).toString();
      const key = `${senderId}_${notif.type}_${targetId}`;

      if (seen.has(key)) {
        duplicateIdsToDelete.push(notif._id);
      } else {
        seen.add(key);
        notifications.push(notif);
      }
    }

    if (duplicateIdsToDelete.length > 0) {
      Notification.deleteMany({ _id: { $in: duplicateIdsToDelete } }).catch((err) =>
        console.error("Cleanup duplicate notifications error:", err)
      );
    }

    return res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error in getAllNotifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();
    return res.status(200).json({ message: "Notification marked as read" });

  } catch (error) {
    console.error("Error in markAsRead:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    await Notification.updateMany(
      { receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );
    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error in markAllNotificationsRead:", error);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
};