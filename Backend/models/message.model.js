import mongoose from 'mongoose';


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
      required: true,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Message = mongoose.model('Message', messageSchema);

export default Message;