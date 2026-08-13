import express from "express";
import {
  getCurrentUser,
  editProfile,
  suggestedUsers,
  getProfile,
  followUser,
  followingList,
} from "../controllers/user.controllers.js";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";

const userRouter = express.Router();

userRouter.get("/current", isAuth, getCurrentUser);
userRouter.get("/suggested", isAuth, suggestedUsers);
userRouter.get("/getProfile/:userName", isAuth, getProfile);
userRouter.put("/editProfile", isAuth, upload.single("profileImage"), editProfile);
userRouter.put("/follow/:userId", isAuth, followUser);
userRouter.get("/followingList", isAuth, followingList);
userRouter.get("/following", isAuth, followingList);

export default userRouter;