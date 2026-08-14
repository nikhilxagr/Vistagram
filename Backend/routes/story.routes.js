import express from "express";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { uploadStory, getStoryByUserName, viewStory, getAllStories, deleteStory, searchMusic } from "../controllers/story.controllers.js";

const storyRouter = express.Router();

storyRouter.get("/music/search", isAuth, searchMusic);
storyRouter.post("/upload", isAuth, upload.single("media"), uploadStory);
storyRouter.get("/all", isAuth, getAllStories);
storyRouter.get("/getbyusername/:username", isAuth, getStoryByUserName);
storyRouter.put("/:storyId/view", isAuth, viewStory);
storyRouter.put("/view/:storyId", isAuth, viewStory);
storyRouter.delete("/delete/:storyId", isAuth, deleteStory);

export default storyRouter;