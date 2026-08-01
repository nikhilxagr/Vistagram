import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true,
            unique: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        bio: {
            type: String,
            default: ""
        },
        profession: {
            type: String,
            default: ""
        },
        gender: {
            type: String,
            enum: ["Male", "Female", "Other"]
        },
        profileImage: {
            type: String,
            default: ""
        },
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        posts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Post"
            }
        ],
        savedPosts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Post"
            }
        ],
        reels: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Reel"
            }
        ],
        story: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Story"
            }
        ],
        resetOtp: {
            type: String,
        },
        otpExpires: {
            type: Date,
        },
        isOtpVerified: {
            type: Boolean,
            default: false
        }
        
    },
    {
        timestamps:true
    })


    const User = mongoose.model("User", userSchema);

    export default User;