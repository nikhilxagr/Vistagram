import express from "express";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { uploadStory, getStoryByUserName, viewStory } from "../controllers/story.controllers.js";

const storyRouter = express.Router();

storyRouter.post("/upload", isAuth, upload.single("media"), uploadStory);
storyRouter.get("/getbyusername/:username", isAuth, getStoryByUserName);
storyRouter.put("/:storyId/view", isAuth, viewStory);

export default storyRouter;