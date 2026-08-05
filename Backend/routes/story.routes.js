import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { uplaodStory, likePost, comments, saved } from "../controllers/post.controllers.js";

import { upload } from "../middlewares/multer.js";

const storyRouter = express.Router();

storyRouter.post("/upload", isAuth, getCurrentUser, upload.single("media"), uplaodStory);
storyRouter.get("/getbyusername/:username", isAuth, getStoryByUserName);
storyRouter.put("/:storyId/view", isAuth, viewStory);

export default storyRouter;