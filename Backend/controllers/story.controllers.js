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

    const story = await Story.create({
      media: mediaUrl,
      mediaType: mediaType || "image",
      author: userId,
    });

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

    const viewersIds = story.viewers?.map((id) => id.toString()) || [];
    if (!viewersIds.includes(userId.toString())) {
      story.viewers = story.viewers || [];
      story.viewers.push(userId);
      await story.save();
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