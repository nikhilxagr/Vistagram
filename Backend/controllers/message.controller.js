import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import fs from "fs";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.userId || req.user?._id;
    const receiverId = req.params.receiverId;
    const { message } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Sender and receiver required" });
    }

    let imageUrl = null;
    if (req.file) {
      try {
        const uploaded = await uploadOnCloudinary(req.file.path);
        imageUrl = typeof uploaded === "string" ? uploaded : uploaded?.secure_url;
      } catch (err) {
        console.error("Cloudinary failed, using local base64 fallback:", err);
        const fileData = fs.readFileSync(req.file.path);
        const mimeType = req.file.mimetype || "image/png";
        imageUrl = `data:${mimeType};base64,${fileData.toString("base64")}`;
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
    }

    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      messages: message || "",
      image: imageUrl,
    });

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        messages: [newMessage._id],
      });
    } else {
      conversation.messages.push(newMessage._id);
      await conversation.save();
    }

    return res.status(200).json({
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Message failed to send", error: error.message });
  }
};

export const getAllMessages = async (req, res) => {
  try {
    const senderId = req.userId || req.user?._id;
    const receiverId = req.params.receiverId;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Sender and receiver required" });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate("messages");

    if (!conversation) {
      return res.status(200).json({ message: "No conversation found", data: [] });
    }

    return res.status(200).json({
      message: "Messages retrieved successfully",
      data: conversation.messages || [],
    });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ message: "Failed to retrieve messages", error: error.message });
  }
};

export const getprevUserChats = async (req, res) => {
  try {
    const currentUserId = req.userId || req.user?._id;
    if (!currentUserId) {
      return res.status(400).json({ message: "User authentication required" });
    }

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate("participants", "name username profileImage")
      .sort({ updatedAt: -1 })
      .populate("messages");

    const userMap = {};
    conversations.forEach((conv) => {
      conv.participants.forEach((user) => {
        if (user?._id && user._id.toString() !== currentUserId.toString()) {
          userMap[user._id.toString()] = user;
        }
      });
    });

    const previousUsers = Object.values(userMap);

    return res.status(200).json({
      message: "Previous users retrieved successfully",
      data: previousUsers,
    });
  } catch (error) {
    console.error("Error retrieving previous user chats:", error);
    res.status(500).json({ message: "Failed to retrieve previous users", error: error.message });
  }
};