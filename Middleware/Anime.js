import { v2 as cloudinary } from "cloudinary";
import Avatar from "../Models/Avatar.js";

// Configure Cloudinary once (ideally in a config file)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const generateAnimeAvatar = async (avatarId, originalImageUrl) => {
  try {
    const uploadResult = await cloudinary.uploader.upload(originalImageUrl, {
      folder: "wardrobe_anime",
      transformation: [
        { effect: "remove_background" },
        { effect: "cartoonify:50" }, // lower intensity to avoid blur in free tier
        { effect: "outline:50" },    // subtle outlines
        { effect: "brightness:10" }, // slightly brighten
        { effect: "saturation:30" }, // boost colors for anime look
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    await Avatar.findByIdAndUpdate(avatarId, {
      imageUrl: uploadResult.secure_url,
    });

    console.log("✅ Anime avatar generated:", uploadResult.secure_url);
  } catch (error) {
    console.error("❌ Anime generation failed:", error);
  }
};
