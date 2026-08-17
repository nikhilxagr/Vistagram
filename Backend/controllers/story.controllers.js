import User from "../models/user.model.js";
import Story from "../models/story.model.js";
import Notification from "../models/notification.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import { getReceiverSocketId, io } from "../socket.js";
import fs from "fs";

export const uploadStory = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { mediaType, music } = req.body;
    let mediaUrl;

    if (req.file) {
      const uploaded = await uploadOnCloudinary(req.file.path);
      mediaUrl = typeof uploaded === "string" ? uploaded : uploaded?.secure_url;
    } else {
      return res.status(400).json({ message: "Media file is required" });
    }

    const isVideo = Boolean(
      req.file?.mimetype?.startsWith("video/") ||
      req.file?.originalname?.match(/\.(mp4|mov|webm|mkv|3gp|avi|m4v)$/i) ||
      mediaType === "video"
    );

    let musicData = null;
    if (music) {
      try {
        musicData = typeof music === "string" ? JSON.parse(music) : music;
      } catch (err) {
        console.log("Could not parse music object:", err);
      }
    }

    const story = await Story.create({
      media: mediaUrl,
      mediaType: isVideo ? "video" : "image",
      author: userId,
      ...(musicData ? { music: musicData } : {}),
    });

    user.story = user.story || [];
    user.story.push(story._id);
    user.stories = user.stories || [];
    user.stories.push(story._id);
    await user.save();

    const populatedStory = await Story.findById(story._id)
      .populate("author", "name username profileImage")
      .populate("viewers", "name username profileImage")
      .populate("likes", "name username profileImage");

    return res.status(201).json({ message: "Story uploaded successfully", story: populatedStory });
  } catch (error) {
    console.error("Error in uploadStory:", error);
    return res.status(500).json({ message: "Error uploading story", error: error.message });
  }
};

export const viewStory = async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const userId = req.userId || req.user?._id;
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    const authorId = (story.author?._id || story.author || "").toString();

    if (authorId === userId.toString()) {
      story.viewers = story.viewers?.filter(
        (id) => (id._id || id).toString() !== userId.toString()
      ) || [];
      await story.save();
    } else {
      const viewersIds = story.viewers?.map((id) => (id._id || id).toString()) || [];
      if (!viewersIds.includes(userId.toString())) {
        story.viewers = story.viewers || [];
        story.viewers.push(userId);
        await story.save();
      }
    }

    const populatedStory = await Story.findById(storyId)
      .populate("author", "name username profileImage")
      .populate("viewers", "name username profileImage")
      .populate("likes", "name username profileImage");
    return res.status(200).json(populatedStory);
  } catch (error) {
    return res.status(500).json({ message: "Error viewing story", error: error.message });
  }
};

export const getStoryByUserName = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const story = await Story.findOne({ author: user._id });
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    const populatedStory = await Story.findById(story._id)
      .populate("author", "name username profileImage")
      .populate("viewers", "name username profileImage")
      .populate("likes", "name username profileImage");
    return res.status(200).json(populatedStory);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching story", error: error.message });
  }
};

export const likeStory = async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const userId = req.userId || req.user?._id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    story.likes = story.likes || [];
    const alreadyLiked = story.likes.some(
      (id) => (id._id || id).toString() === userId.toString()
    );

    if (alreadyLiked) {
      story.likes = story.likes.filter(
        (id) => (id._id || id).toString() !== userId.toString()
      );

      // Clean up like notification on unlike
      const storyAuthorId = (story.author?._id || story.author || "").toString();
      if (storyAuthorId !== userId.toString()) {
        const deletedNotif = await Notification.findOneAndDelete({
          sender: userId,
          receiver: story.author,
          type: "like",
          story: story._id,
        });

        const receiverSocketId = getReceiverSocketId(storyAuthorId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("removeNotification", {
            notificationId: deletedNotif?._id?.toString(),
            senderId: userId.toString(),
            type: "like",
            storyId: story._id.toString(),
          });
        }
      }
    } else {
      story.likes.push(userId);

      const storyAuthorId = (story.author?._id || story.author || "").toString();
      if (storyAuthorId !== userId.toString()) {
        const sender = await User.findById(userId).select("name username profileImage");
        const notification = await Notification.findOneAndUpdate(
          { sender: userId, receiver: story.author, type: "like", story: story._id },
          {
            $set: {
              isRead: false,
              message: `${sender?.name || sender?.username || "Someone"} liked your story.`,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).populate("sender", "name username profileImage");

        const receiverSocketId = getReceiverSocketId(storyAuthorId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newNotification", notification);
        }
      }
    }

    await story.save();

    if (io) {
      io.emit("storyLiked", {
        storyId: story._id.toString(),
        userId: userId.toString(),
        likes: story.likes.map((id) => (id._id || id).toString()),
      });
    }

    const populatedStory = await Story.findById(storyId)
      .populate("author", "name username profileImage")
      .populate("viewers", "name username profileImage")
      .populate("likes", "name username profileImage");

    return res.status(200).json({
      message: "Story like toggled successfully",
      story: populatedStory,
      likes: story.likes,
      likesCount: story.likes.length,
      isLiked: !alreadyLiked,
    });
  } catch (error) {
    console.error("Error in likeStory:", error);
    return res.status(500).json({ message: "Error liking story", error: error.message });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const userId = req.userId || req.user?._id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    const storyAuthorId = (story.author?._id || story.author || "").toString();

    if (storyAuthorId !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this story" });
    }

    await Story.findByIdAndDelete(storyId);

    await User.findByIdAndUpdate(userId, {
      $pull: { story: storyId, stories: storyId },
    });

    return res.status(200).json({ message: "Story deleted successfully", storyId });
  } catch (error) {
    console.error("Error in deleteStory:", error);
    return res.status(500).json({ message: "Error deleting story", error: error.message });
  }
};

export const getAllStories = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    let allowedUserIds = [];

    if (userId) {
      const currentUser = await User.findById(userId);
      const followingIds = currentUser?.following?.map((id) => id.toString()) || [];
      const followerIds = currentUser?.followers?.map((id) => id.toString()) || [];

      allowedUserIds = Array.from(
        new Set([...followingIds, ...followerIds, userId.toString()])
      ).filter(Boolean);
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let query = { createdAt: { $gte: twentyFourHoursAgo } };
    if (allowedUserIds.length > 0) {
      query.author = { $in: allowedUserIds };
    }

    let stories = await Story.find(query)
      .populate("author", "name username profileImage")
      .populate("viewers", "name username profileImage")
      .populate("likes", "name username profileImage")
      .sort({ createdAt: -1 });

    if (!stories || stories.length === 0) {
      stories = await Story.find({ createdAt: { $gte: twentyFourHoursAgo } })
        .populate("author", "name username profileImage")
        .populate("viewers", "name username profileImage")
        .populate("likes", "name username profileImage")
        .sort({ createdAt: -1 });
    }

    return res.status(200).json(stories);
  } catch (error) {
    console.error("Error in getAllStories:", error);
    return res.status(500).json({ message: "Error fetching stories", error: error.message });
  }
};

export const searchMusic = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || !query.trim()) {
      return res.status(200).json({ results: [] });
    }

    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      query.trim()
    )}&media=music&entity=song&limit=30`;

    const response = await fetch(itunesUrl, { signal: AbortSignal.timeout(10000) });
    const data = await response.json();

    const results = (data?.results || [])
      .map((item) => ({
        id: item.trackId?.toString() || Math.random().toString(),
        title: item.trackName || "Untitled Track",
        artist: item.artistName || "Unknown Artist",
        audioUrl: item.previewUrl,
        coverImage: item.artworkUrl100?.replace("100x100bb", "300x300bb") || item.artworkUrl100,
        duration: 30,
      }))
      .filter((item) => Boolean(item.audioUrl));

    return res.status(200).json({ results });
  } catch (error) {
    console.error("Error in searchMusic proxy:", error?.message);
    return res.status(500).json({ message: "Failed to fetch songs", error: error.message });
  }
};