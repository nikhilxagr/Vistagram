import express from "express";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { uploadStory, getStoryByUserName, viewStory, getAllStories, deleteStory, searchMusic, likeStory } from "../controllers/story.controllers.js";

const storyRouter = express.Router();

storyRouter.get("/music/search", isAuth, searchMusic);
storyRouter.post("/upload", isAuth, upload.single("media"), uploadStory);
storyRouter.get("/all", isAuth, getAllStories);
storyRouter.get("/getbyusername/:username", isAuth, getStoryByUserName);
storyRouter.put("/:storyId/view", isAuth, viewStory);
storyRouter.put("/view/:storyId", isAuth, viewStory);
storyRouter.put("/:storyId/like", isAuth, likeStory);
storyRouter.put("/like/:storyId", isAuth, likeStory);
storyRouter.delete("/delete/:storyId", isAuth, deleteStory);

export default storyRouter;