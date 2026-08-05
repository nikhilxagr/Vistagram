import User from "../models/user.model.js";
import Story from "../models/story.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


export const uploadStory = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if(!user.story)  {
       await Story.findByIdAndDelete(user.story);
       user.story = null;
    }


    const {mediaType} = req.body;
    let media;
    if (req.file) {
      media = await uploadOnCloudinary(req.file.path);
    } else {
      return res.status(400).json({ message: "media is required" });
    }

    const story = await Story.create({
      media: media.secure_url,
      mediaType,
      author: req.userId,
    });
    user.stories.push(story._id);
    await user.save();
    const populatedStory = await Story.findById(story._id).
    populate(
      "author",
      "name username profileImage")
      .populate("viewers.author", "name username profileImage")
    return res.status(201).json(populatedStory);
  }
    catch (error) {
    return res.status(500).json({ message: "Error uploading story", error });
  }
};

export const viewStory = async (req, res) => {
    try {
        const storyId = req.params.storyId;
        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }
        const viewersIds = story.viewers.map(id => id.toString());
        if (!viewersIds.includes(req.userId.toString())) {
            story.viewers.push(req.userId);
            await story.save();
        }

        const populatedStory = await Story.findById(storyId)
            .populate("author", "name username profileImage")
            .populate("viewers.author", "name username profileImage");
        return res.status(200).json(populatedStory);
    } catch (error) {
        return res.status(500).json({ message: "Error viewing story", error });
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
            .populate("viewers.author", "name username profileImage");
        return res.status(200).json(populatedStory);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching story", error });
    }
};