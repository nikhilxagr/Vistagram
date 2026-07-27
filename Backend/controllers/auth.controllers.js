import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../config/token.js";

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
      sameSite: "strict",
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
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Username not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "incorrect password" });
    }

    const token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      sameSite: "strict",
      maxAge: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
    });
    res.status(200).json({ message: "Signin successful", user });
  } catch (error) {
    res.status(500).json({ message: "Signin failed" });
  }
};

export const signOut = async (req, res) => {
    try {
        res.clearCookie("token");
        res.status(200).json({ message: "Signout successful" });
    } 
    catch (error) {
        res.status(500).json({ message: "Signout failed" });    
    }
}
