import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import postReducer from "./post.Slice";
import reelReducer from "./reel.Slice";
import storyReducer from "./story.slice";
import messageReducer from "./message.Slice";
import socketReducer from "./socket.Slice";
import notificationReducer from "./notification.Slice";

const store = configureStore({
  reducer: {
    user: userReducer,
    post: postReducer,
    reel: reelReducer,
    story: storyReducer,
    message: messageReducer,
    socket: socketReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["socket/setSocket"],
        ignoredPaths: ["socket.socket"],
      },
    }),
});

export default store;