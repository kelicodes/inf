import mongoose from "mongoose";

const AvatarSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  imageUrl: { type: String },        // generated avatar later
  originalImage: { type: String, required: true },

  height: Number,
  weight: Number,
  clothingSize: String,
  shoeSize: Number,
  favoriteColor: String,
  stylePreference: String,
  budgetRange: String,
  bodyType: String,

  createdAt: { type: Date, default: Date.now },
});



const Avatar= mongoose.models.Avatar || mongoose.model("Avatar",AvatarSchema)
export default Avatar
