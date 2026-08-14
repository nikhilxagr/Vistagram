import express from "express";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import {
  uploadPost,
  getAllPosts,
  getPostById,
  editPost,
  deletePost,
  likePost,
  comments,
  saved,
  deleteComment,
  likeComment,
} from "../controllers/post.controllers.js";

const postRouter = express.Router();

postRouter.post("/upload", isAuth, upload.single("media"), uploadPost);
postRouter.get("/getall", isAuth, getAllPosts);
postRouter.get("/:id", isAuth, getPostById);
postRouter.delete("/:id", isAuth, deletePost);

// sub-routes
postRouter.put("/:id/edit", isAuth, editPost);
postRouter.put("/:id/like", isAuth, likePost);
postRouter.put("/:id/save", isAuth, saved);
postRouter.post("/:id/comment", isAuth, comments);
postRouter.delete("/:postId/comment/:commentId", isAuth, deleteComment);
postRouter.put("/:postId/comment/:commentId/like", isAuth, likeComment);

//  last
postRouter.put("/:id", isAuth, editPost);

export default postRouter;