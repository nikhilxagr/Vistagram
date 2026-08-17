import uploadOnCloudinary from "../config/cloudinary.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { getReceiverSocketId, io } from "../socket.js";
import fs from "fs";

export const uploadReel = async (req, res) => {
  try {
    const { caption, music } = req.body;
    let mediaUrl;

    if (req.file) {
      const uploaded = await uploadOnCloudinary(req.file.path);
      mediaUrl = typeof uploaded === "string" ? uploaded : uploaded?.secure_url;
    } else {
      return res.status(400).json({ message: "Media file is required" });
    }

    const userId = req.userId || req.user?._id;

    let musicData = null;
    if (music) {
      try {
        musicData = typeof music === "string" ? JSON.parse(music) : music;
      } catch (err) {
        console.log("Could not parse reel music:", err);
      }
    }

    const reel = await Post.create({
      caption,
      media: mediaUrl,
      mediaType: "video",
      author: userId,
      ...(musicData ? { music: musicData } : {}),
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

      // Clean up like notification on unlike
      if (reel.author.toString() !== userId.toString()) {
        const deletedNotif = await Notification.findOneAndDelete({
          sender: userId,
          receiver: reel.author,
          type: "like",
          reel: reel._id,
        });

        const receiverSocketId = getReceiverSocketId(reel.author.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("removeNotification", {
            notificationId: deletedNotif?._id?.toString(),
            senderId: userId.toString(),
            type: "like",
            reelId: reel._id.toString(),
          });
        }
      }
    } else {
      reel.likes = reel.likes || [];
      reel.likes.push(userId);
      if (reel.author.toString() !== userId.toString()) {
        const sender = await User.findById(userId).select("name username profileImage");
        const notification = await Notification.findOneAndUpdate(
          { sender: userId, receiver: reel.author, type: "like", reel: reel._id },
          {
            $set: {
              isRead: false,
              message: `${sender?.name || sender?.username || "Someone"} liked your reel.`,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).populate("sender", "name username profileImage")
          .populate("reel", "media caption");

        const receiverSocketId = getReceiverSocketId(reel.author.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newNotification", notification);
        }
      }
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

       if(reel.author.toString() !== userId.toString()) {
            const notification = await Notification.create({
              sender:req.userId || req.user?._id,
              receiver: reel.author._id,
              type: "comment",
              reel: reel._id,
              message: `${req.user.name} commented on your reel.`,
            });
    
            const populatedNotification = await Notification.findById(notification._id)
            .populate("sender", "name username profileImage")
    
            const receiverSocketId=getSocketId(reel.author._id.toString())
            if(receiverSocketId){
              io.to(receiverSocketId).emit("newNotification", populatedNotification);
            }
        }
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