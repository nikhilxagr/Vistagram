import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../config/token.js";
import sendMail from "../config/Mail.js";

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const username = req.body.username || req.body.userName;

    if (!name || !email || !password || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const findByUsername = await User.findOne({ username });
    if (findByUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      username,
    });
    const token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
    });
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.error("Error in signup controller:", error);
    res.status(500).json({ message: "Signup failed" });
  }
};

export const signin = async (req, res) => {
  try {
    const username = req.body.username || req.body.userName;
    const { password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Username not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
    });
    res.status(200).json({ message: "Signin successful", user });
  } catch (error) {
    console.error("Error in signin controller:", error);
    res.status(500).json({ message: "Signin failed" });
  }
};

export const signOut = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
    res.status(200).json({ message: "Signout successful" });
  } catch (error) {
    res.status(500).json({ message: "Signout failed" });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    user.resetOtp = otp;
    user.otpExpires=otpExpiry;
    user.isOtpVerified = false;

    await user.save();

    // Send OTP via email
    await sendMail(email, otp, "Your OTP for password reset");

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Error in sendOtp controller:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    user.isOtpVerified = true;
    user.resetOtp = undefined; // Clear the OTP after successful verification
    user.otpExpires = undefined; // Clear the OTP expiry after successful verification
    await user.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error in verifyOtp controller:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    if (!user.isOtpVerified) {
      return res.status(400).json({ message: "OTP not verified" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = undefined; // Clear the OTP after successful password reset
    user.otpExpires = undefined; // Clear the OTP expiry
    user.isOtpVerified = false; // Reset OTP verification status

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error in resetPassword controller:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};