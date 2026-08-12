import express from "express";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { sendMessage, getAllMessages, getprevUserChats } from "../controllers/message.controller.js";

const messageRouter = express.Router();

messageRouter.post("/send/:receiverId", isAuth, upload.single("image"), sendMessage);
messageRouter.get("/getAll/:receiverId", isAuth, getAllMessages);
messageRouter.get("/getall/:receiverId", isAuth, getAllMessages);
messageRouter.get("/getAll", isAuth, getAllMessages);
messageRouter.put("/prevChats", isAuth, getprevUserChats);

export default messageRouter;