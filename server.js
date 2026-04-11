import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";

// Import routers
import userRouter from "./Routes/userRouter.js";
import productRouter from "./Routes/productRoute.js";
import Cartrouter from "./Routes/Cartroutes.js";
import Orderrouter from "./Routes/OrderRoutes.js";
import Pesarouter from "./Routes/Pesaroutes.js";
import Paybillrouter from "./Routes/Paybill.js";
import avatarRouter from "./Routes/Avatarrouter.js";

// Import database
import DB from "./Config/DB.js";
import Avatar from "./Models/Avatar.js";

const app = express();
const PORT = process.env.PORT || 10000;

// ====== MIDDLEWARES ======

// Parse JSON bodies

app.use(express.json({ limit: "10mb" }));  // VERY IMPORTANT

// Parse URL-encoded bodies (for forms)
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// CORS (allow your frontend domains)
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local frontend
      "https://mygold-two.vercel.app", // deployed frontend
      "https://goldfront.vercel.app",
      "https://goldfrontadmin.vercel.app",
      "https://legendary-eureka-tau.vercel.app"
    ],
    credentials: true, // allow cookies
  })
);

// ====== DATABASE ======
DB();

// ====== ROUTES ======
app.use("/user", userRouter);
app.use("/products", productRouter);
app.use("/cart", Cartrouter);
app.use("/orders", Orderrouter);
app.use("/pesa", Pesarouter);
app.use("/pay", Paybillrouter)
app.use("/avatar", avatarRouter)
// ====== HEALTH CHECK ======
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ====== GLOBAL ERROR HANDLER (optional) ======
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Server error" });
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
