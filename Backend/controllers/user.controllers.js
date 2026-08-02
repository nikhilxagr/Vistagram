import User from "../models/user.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";

export const getCurrentUser = async (req, res) => {

  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Current user not found" });
  }
};

export const suggestedUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: {$ne: req.userId}})
      .select("-password");

    return res.status(200).json({ users });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch suggested users" });
  }
} 


export const editProfile = async (req, res) => {
  try {
    const { name, username , bio, profession, gender } = req.body;
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const sameUserWithUsername = await User.findOne({ username }).select("-password");
    if (sameUserWithUsername && sameUserWithUsername._id.toString() !== req.userId) {
      return res.status(400).json({ message: "Username already exists" });
    }

    let profileImage;
    if (req.file) {
      profileImage = await uploadOnCloudinary(req.file.path);
    }

    user.name = name || user.name;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.profession = profession || user.profession;
    user.gender = gender || user.gender;
    if (profileImage) {
      user.profileImage = profileImage.secure_url;
    }

    await user.save();
    return res.status(200).json({ message: "Profile updated successfully", user });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to edit profile" });
  }
}

export const getProfile = async (req, res) => {
  try {
    const userName = req.params.userName;
    const user = await User.findOne({ username: userName }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};