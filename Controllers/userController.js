import user from "../Models/Usermodel.js";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import crypto from "crypto";
import Postmark from "postmark";

/* ================= POSTMARK CLIENT ================= */
const postmarkClient = new Postmark.ServerClient(process.env.POSTMARK);

/* ================= USER REGISTRATION ================= */
export const userRegistration = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.json({ success: false, message: "All fields are required" });
    }

    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.json({
        success: false,
        message: "User with email already registered",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new user({ name, email, password: hashedPassword });
    await newUser.save();

    const token = JWT.sign({ id: newUser._id }, process.env.SECRETWORD, { expiresIn: "1d" });

    return res.json({
      success: true,
      message: "User registration successful",
      token,
    });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "User registration failed" });
  }
};

/* ================= USER SIGN IN ================= */
export const userSignin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ success: false, message: "All fields are required" });
    }

    const theUser = await user.findOne({ email });
    if (!theUser) return res.json({ success: false, message: "User not found" });

    const passwordMatch = await bcrypt.compare(password, theUser.password);
    if (!passwordMatch) return res.json({ success: false, message: "Invalid password" });

    const token = JWT.sign({ id: theUser._id }, process.env.SECRETWORD, { expiresIn: "1d" });

    return res.json({ success: true, message: "User signin successful", token });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "User login failed" });
  }
};

/* ================= LOGOUT ================= */
export const logout = async (req, res) => {
  return res.json({ success: true, message: "User logged out. Remove token on client side." });
};

/* ================= FETCH ME ================= */
export const fecthme = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "User not authenticated" });

    const me = await user.findById(userId).select("-password");
    if (!me) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, me });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= FORGOT PASSWORD ================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ success: false, message: "Email is required" });

    const theUser = await user.findOne({ email });
    if (!theUser) return res.json({ success: false, message: "User not found" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    theUser.resetCode = hashedCode;
    theUser.codeDate = Date.now() + 10 * 60 * 1000; // 10 minutes
    await theUser.save();

    // Send email via Postmark
    await postmarkClient.sendEmail({
      From: process.env.EMAIL, // must be verified in Postmark
      To: email,
      Subject: "Password Reset Code",
      HtmlBody: `<h3>Password Reset</h3><h2>${code}</h2><p>This code expires in 10 minutes.</p>`,
    });

    return res.json({ success: true, message: "Reset code sent to email" });
  } catch (err) {
    console.error("Postmark error:", err);
    
    res.status(500).json({ success: false, message: err.message, stack: err.stack });

  }
};

/* ================= VERIFY RESET CODE ================= */
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.json({ success: false, message: "Email and code are required" });

    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    const theUser = await user.findOne({ email, resetCode: hashedCode, codeDate: { $gt: Date.now() } });
    if (!theUser) return res.json({ success: false, message: "Invalid or expired code" });

    const resetToken = JWT.sign({ id: theUser._id }, process.env.SECRETWORD, { expiresIn: "15m" });

    return res.json({ success: true, resetToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message, stack: err.stack });

  }
};

/* ================= RESET PASSWORD ================= */
export const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token || !newPassword) return res.json({ success: false, message: "Token and new password required" });

    const decoded = JWT.verify(token, process.env.SECRETWORD);
    const theUser = await user.findById(decoded.id);
    if (!theUser) return res.json({ success: false, message: "User not found" });

    const salt = await bcrypt.genSalt(10);
    theUser.password = await bcrypt.hash(newPassword, salt);
    theUser.resetCode = undefined;
    theUser.codeDate = undefined;
    await theUser.save();

    return res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message, stack: err.stack });

  }
};
