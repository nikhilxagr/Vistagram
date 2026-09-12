import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import fs from "fs";
import { io, getReceiverSocketId } from "../socket.js";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.userId || req.user?._id;
    const receiverId = req.params.receiverId;
    const { message, audioDuration } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Sender and receiver required" });
    }

    const imageFile = req.files?.image?.[0] || (req.file?.fieldname === "image" ? req.file : null);
    const audioFile = req.files?.audio?.[0] || (req.file?.fieldname === "audio" ? req.file : null);

    let imageUrl = null;
    if (imageFile) {
      try {
        const uploaded = await uploadOnCloudinary(imageFile.path);
        imageUrl = typeof uploaded === "string" ? uploaded : uploaded?.secure_url;
      } catch (err) {
        console.error("Cloudinary failed for image, using local base64 fallback:", err);
        const fileData = fs.readFileSync(imageFile.path);
        const mimeType = imageFile.mimetype || "image/png";
        imageUrl = `data:${mimeType};base64,${fileData.toString("base64")}`;
        if (fs.existsSync(imageFile.path)) {
          fs.unlinkSync(imageFile.path);
        }
      }
    }

    let audioUrl = null;
    if (audioFile) {
      try {
        const uploaded = await uploadOnCloudinary(audioFile.path);
        audioUrl = typeof uploaded === "string" ? uploaded : uploaded?.secure_url;
      } catch (err) {
        console.error("Cloudinary failed for audio, using local base64 fallback:", err);
        const fileData = fs.readFileSync(audioFile.path);
        const mimeType = audioFile.mimetype || "audio/webm";
        audioUrl = `data:${mimeType};base64,${fileData.toString("base64")}`;
        if (fs.existsSync(audioFile.path)) {
          fs.unlinkSync(audioFile.path);
        }
      }
    }

    let messageType = "text";
    if (audioUrl) {
      messageType = "audio";
    } else if (imageUrl) {
      messageType = "image";
    } else if (message && message.includes('"type":"reel_share"')) {
      messageType = "reel_share";
    }

    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      messages: message || "",
      image: imageUrl,
      audio: audioUrl,
      audioDuration: audioDuration ? Number(audioDuration) : 0,
      messageType,
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

    // Socket.io real-time communication
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
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

    let previousUsers = Object.values(userMap);

    if (previousUsers.length === 0) {
      const otherUsers = await User.find({ _id: { $ne: currentUserId } })
        .select("name username profileImage")
        .limit(20);
      previousUsers = otherUsers;
    }

    return res.status(200).json({
      message: "Users retrieved successfully",
      data: previousUsers,
    });
  } catch (error) {
    console.error("Error retrieving user chats:", error);
    res.status(500).json({ message: "Failed to retrieve users", error: error.message });
  }
};