import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: null,
    },
    audio: {
      type: String,
      default: null,
    },
    audioDuration: {
      type: Number,
      default: 0,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "audio", "reel_share"],
      default: "text",
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
      },
    ],
    replyTo: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
      },
      text: {
        type: String,
        default: "",
      },
      senderName: {
        type: String,
        default: "",
      },
      messageType: {
        type: String,
        default: "text",
      },
      image: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;