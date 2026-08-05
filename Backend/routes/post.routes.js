import express from "express";
import isAuth from "../middlewares/isAuth.js";

import { upload } from "../middlewares/multer.js";
import { getCurrentUser } from "../middlewares/getCurrentUser.js";
import { uploadPost } from "../controllers/post.controllers.js";
import { getAllPosts } from "../controllers/post.controllers.js";
import { getPostById } from "../controllers/post.controllers.js";
import { likePost } from "../controllers/post.controllers.js";
import { comments } from "../controllers/post.controllers.js";
import { saved } from "../controllers/post.controllers.js";

const postRouter = express.Router();

postRouter.post("/upload", isAuth, getCurrentUser, upload.single("media"), uploadPost);
postRouter.get("/getall", isAuth, getAllPosts);
postRouter.get("/:id", isAuth, getPostById);
postRouter.put("/:id/like", isAuth, likePost);
postRouter.post("/:id/comment", isAuth, comments);
postRouter.put("/:postId/save", isAuth, saved);