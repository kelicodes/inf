
import express from "express";
import upload from "../Middleware/Multer.js"; // Multer middleware for file upload
import { uploadAvatar, getAvatar, fetchAllAvatars, postAnimeAvatar } from "../Controllers/Avatarcontroller.js";
import UserAuth from "../Middleware/userAuth.js";

const avatarRouter = express.Router();

// Upload avatar (single file field: "file")
avatarRouter.post("/upload", UserAuth, upload.single("file"), uploadAvatar);

// Post anime version (avatar ID sent in body)
avatarRouter.post("/post-anime",  upload.single("animeImage"), postAnimeAvatar);

// Get current user's avatar
avatarRouter.get("/", UserAuth, getAvatar);

// Get all avatars
avatarRouter.get("/all", fetchAllAvatars);

export default avatarRouter;
