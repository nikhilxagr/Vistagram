import mongoose from "mongoose";


const notificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["follow", "like", "comment"],
    required: true
    },
    message: {
      type: String,
      required: true
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post"
    },
    reel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reel"
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story"
    },
    isRead: {
      type: Boolean,
      default: false
    },

  },
  {
    timestamps: true
  }
);

notificationSchema.index(
  { sender: 1, receiver: 1, type: 1, post: 1 },
  { unique: true, sparse: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;