import express from "express";
import {
  signin,
  signup,
  signOut,
  sendOtp,
  verifyOtp,
  resetPassword,
} from "../controllers/auth.controllers.js";

const authRouter = express.Router();

// Authentication
authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
authRouter.post("/signout", signOut);

// Forgot Password
authRouter.post("/send-otp", sendOtp);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/reset-password", resetPassword);

export default authRouter;
