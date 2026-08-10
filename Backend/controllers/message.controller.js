import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import  uploadOnCloudinary from "../config/cloudinary.js";


export const sendMessage = async (req, res) => {
  try {
    const senderId = req.body;
    const receiverId = req.params.receiverId;
    const { message } = req.body;

    let image;
    if (req.file) {
      image = await uploadOnCloudinary(req.file.path);
    }

    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      messages: message,
      image: image ? image.secure_url : null,
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
    return res.status(200).json({ message: "Message sent successfully", data: newMessage });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Message failed to send" });
  }
}

export const getAllMessages = async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = req.params.receiverId; 
        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        }).populate('messages');

        return res.status(200).json({ message: "Messages retrieved successfully", data: conversation.messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve messages" });
    }
}

export const getprevUserChats = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const conversations = await Conversation.find({
            participants: currentUserId,
        }).populate('participants').sort({ updatedAt: -1 }).populate('messages');

        const userMap = {};   // 343242u34:user
        conversations.forEach(conv => {
            conv.participants.forEach(user => {
                if(user._id.toString() !== currentUserId) {
                    userMap[user._id.toString()] = user;
                }
            });
        });

        const previousUsers =Object.values(userMap);

        return res.status(200).json({ message: "Previous users retrieved successfully", data: previousUsers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve previous users" });
    }
}