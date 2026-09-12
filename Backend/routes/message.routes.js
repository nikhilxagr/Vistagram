import express from "express";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import {
  sendMessage,
  getAllMessages,
  getprevUserChats,
  reactToMessage,
  unsendMessage,
} from "../controllers/message.controller.js";

const messageRouter = express.Router();

messageRouter.post(
  "/send/:receiverId",
  isAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  sendMessage
);
messageRouter.put("/react/:messageId", isAuth, reactToMessage);
messageRouter.delete("/unsend/:messageId", isAuth, unsendMessage);
messageRouter.get("/getAll/:receiverId", isAuth, getAllMessages);
messageRouter.get("/getall/:receiverId", isAuth, getAllMessages);
messageRouter.get("/getAll", isAuth, getAllMessages);
messageRouter.put("/prevChats", isAuth, getprevUserChats);

export default messageRouter;