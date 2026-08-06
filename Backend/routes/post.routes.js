import express from "express";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { uploadPost, getAllPosts, getPostById, likePost, comments, saved } from "../controllers/post.controllers.js";

const postRouter = express.Router();

postRouter.post("/upload", isAuth, upload.single("media"), uploadPost);
postRouter.get("/getall", isAuth, getAllPosts);
postRouter.get("/:id", isAuth, getPostById);
postRouter.put("/:id/like", isAuth, likePost);
postRouter.post("/:id/comment", isAuth, comments);
postRouter.put("/:postId/save", isAuth, saved);
postRouter.put("/:id/save", isAuth, saved);

export default postRouter;