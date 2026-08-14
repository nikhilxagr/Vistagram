import User from "../models/user.model.js";
import Story from "../models/story.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import fs from "fs";

export const uploadStory = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { mediaType } = req.body;
    let mediaUrl;

    if (req.file) {
      const uploaded = await uploadOnCloudinary(req.file.path);
      mediaUrl = typeof uploaded === "string" ? uploaded : uploaded?.secure_url;
    } else {
      return res.status(400).json({ message: "Media file is required" });
    }

    const isVideo = req.file.mimetype?.startsWith("video/") || mediaType === "video";

    const story = await Story.create({
      media: mediaUrl,
      mediaType: isVideo ? "video" : "image",
      author: userId,
    });

    user.story = user.story || [];
    user.story.push(story._id);
    user.stories = user.stories || [];
    user.stories.push(story._id);
    await user.save();

    const populatedStory = await Story.findById(story._id).populate(
      "author",
      "name username profileImage"
    );

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

    // If author is viewing their own story, ensure author ID is NOT in viewers
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
      .populate("viewers", "name username profileImage");
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
      .populate("viewers", "name username profileImage");
    return res.status(200).json(populatedStory);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching story", error: error.message });
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
      .sort({ createdAt: -1 });

    if (!stories || stories.length === 0) {
      stories = await Story.find({ createdAt: { $gte: twentyFourHoursAgo } })
        .populate("author", "name username profileImage")
        .populate("viewers", "name username profileImage")
        .sort({ createdAt: -1 });
    }

    return res.status(200).json(stories);
  } catch (error) {
    console.error("Error in getAllStories:", error);
    return res.status(500).json({ message: "Error fetching stories", error: error.message });
  }
};