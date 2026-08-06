import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        mediaType: {
            type: String,
            enum: ["image", "video"],
            required: true
        },
        media: {
            type: String,
            required: true
        },
        caption: {
            type: String,
            default: ""
        },
        viewers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 86400 // 24 hours in seconds
        }
    },
    {
        timestamps: true
    }
);

const Story = mongoose.model("Story", storySchema);
export default Story;
