import express from "express";
import { getCurrentUser } from "../controllers/user.controllers.js";
import isAuth from "../middleware/isAuth.js";
import { suggestedUsers } from "../controllers/user.controllers.js";

const userRouter = express.Router();

userRouter.get("/current", isAuth,getCurrentUser);
userRouter.get("/suggested", isAuth, suggestedUsers);

export default userRouter;
