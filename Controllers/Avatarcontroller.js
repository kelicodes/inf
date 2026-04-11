import { generateAnimeAvatar } from "../Middleware/Anime.js";
import Avatar from "../Models/Avatar.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDKEY,
  api_secret: process.env.CLOUDSECRET,
});

// ===== Upload avatar details and original image only =====
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    console.log("REQ FILE:", req.file);
    console.log("REQ BODY:", req.body);

    const {
      height,
      weight,
      clothingSize,
      shoeSize,
      favoriteColor,
      stylePreference,
      budgetRange,
      bodyType,
    } = req.body;

    // Upload original image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "wardrobe_original",
    });

    // Upsert avatar
    const avatar = await Avatar.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        originalImage: uploadResult.secure_url,
        imageUrl: "",
        height,
        weight,
        clothingSize,
        shoeSize,
        favoriteColor,
        stylePreference,
        budgetRange,
        bodyType,
      },
      { new: true, upsert: true }
    );

    // Background task (optional)
    // await generateAnimeAvatar(avatar._id, uploadResult.secure_url);

    return res.status(201).json({
      success: true,
      message: "Profile saved successfully",
      avatar,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return res.status(500).json({ success: false, message: "Avatar upload failed" });
  }
};

// ===== Get User Avatar =====
export const getAvatar = async (req, res) => {
  try {
    const avatar = await Avatar.findOne({ user: req.user._id });

    if (!avatar) {
      return res.status(404).json({ success: false, message: "Avatar not found" });
    }

    return res.status(200).json({ success: true, avatar });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch avatar" });
  }
};

// ===== Fetch All Avatars =====
export const fetchAllAvatars = async (req, res) => {
  try {
    const allAvatars = await Avatar.find();
    return res.json({ success: true, message: "All avatars fetched", allAvatars });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "Failed to fetch avatars" });
  }
};

// ===== Post Anime Version =====
export const postAnimeAvatar = async (req, res) => {
  try {
    console.log(req.body)
    const {avatarId} = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No anime image uploaded" });
    }

    // Upload anime image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "wardrobe_anime",
    });

    // Update avatar document
    const updatedAvatar = await Avatar.findByIdAndUpdate(
      avatarId,
      { imageUrl: uploadResult.secure_url },
      { new: true }
    );

    console.log(updatedAvatar)

    return res.status(200).json({
      success: true,
      message: "Anime version posted successfully",
      avatar: updatedAvatar,
    });
  } catch (err) {
    console.error("Post Anime Error:", err);
    return res.status(500).json({ success: false, message: "Failed to post anime version" });
  }
};
