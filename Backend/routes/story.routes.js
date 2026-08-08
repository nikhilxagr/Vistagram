import express from "express";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { uploadStory, getStoryByUserName, viewStory, getAllStories } from "../controllers/story.controllers.js";

const storyRouter = express.Router();

storyRouter.post("/upload", isAuth, upload.single("media"), uploadStory);
storyRouter.get("/all", isAuth, getAllStories);
storyRouter.get("/getbyusername/:username", isAuth, getStoryByUserName);
storyRouter.put("/:storyId/view", isAuth, viewStory);

export default storyRouter;