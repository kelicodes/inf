import express from "express";
import {
  userRegistration,
  userSignin,
  logout,
  fecthme,
  forgotPassword,
  verifyResetCode,
  resetPassword
} from "../Controllers/userController.js";
import UserAuth from "../Middleware/userAuth.js";

const userRouter = express.Router();

userRouter.post("/reg", userRegistration);
userRouter.post("/login", userSignin);
userRouter.post("/logout", logout);
userRouter.get("/me", UserAuth, fecthme);

// 🔐 Forgot password flow
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/verify-reset-code", verifyResetCode);
userRouter.post("/reset-password", resetPassword);

export default userRouter;
