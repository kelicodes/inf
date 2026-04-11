import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DB = async () => {
  try {
    await mongoose.connect(process.env.MONGOURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB connected successfully");
  } catch (e) {
    console.error("Error in DB:", e.message);
    process.exit(1);
  }
};

export default DB;
