import express from "express";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { uploadReel, getAllReels, like, comments } from "../controllers/reel.controllers.js";

const reelRouter = express.Router();

reelRouter.post("/upload", isAuth, upload.single("media"), uploadReel);
reelRouter.get("/getall", isAuth, getAllReels);
reelRouter.put("/:id/like", isAuth, like);
reelRouter.post("/:id/comment", isAuth, comments);

export default reelRouter;