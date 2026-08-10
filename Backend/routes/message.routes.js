import express from "express";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { sendMessage, getAllMessages, getprevUserChats } from "../controllers/message.controller.js";

const messageRouter = express.Router();

messageRouter.post("/send/:receiverId", isAuth, upload.single("image"), sendMessage);
messageRouter.get("/getall", isAuth, getAllMessages);
messageRouter.put("/prevChats", isAuth, getprevUserChats);

export default messageRouter;