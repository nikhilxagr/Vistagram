import express from "express";
import isAuth from "../middlewares/isAuth.js";

import { upload } from "../middlewares/multer.js";

const reelRouter = express.Router();

reelRouter.post("/upload", isAuth, getCurrentUser, upload.single("media"), uploadPost);
reelRouter.get("/getall", isAuth, getAllReels);
reelRouter.put("/:reelId/like", isAuth, likePost);
reelRouter.post("/:reelId/comment", isAuth, comments);
reelRouter.get("/:reelId/saved", isAuth, saved);

export default reelRouter;