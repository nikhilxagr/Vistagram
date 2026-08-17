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
        music: {
            title: { type: String, default: "" },
            artist: { type: String, default: "" },
            audioUrl: { type: String, default: "" },
            coverImage: { type: String, default: "" },
            duration: { type: Number, default: 30 }
        },
        viewers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        likes: [
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
