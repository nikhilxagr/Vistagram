import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";

const uploadOnCloudinary = async (file) => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const isVideoOrAudio = Boolean(file?.match(/\.(mp4|mov|webm|mkv|3gp|avi|m4v|mp3|wav|ogg|m4a|aac)$/i));

    const result = await cloudinary.uploader.upload(file, {
      resource_type: isVideoOrAudio ? "video" : "auto",
      timeout: 120000,
    });

    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch {}

    return result.secure_url;
  } catch (error) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch {}
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

export default uploadOnCloudinary;