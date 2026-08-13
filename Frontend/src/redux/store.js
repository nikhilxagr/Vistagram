import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import postReducer from "./post.Slice";
import reelReducer from "./reel.Slice";
import storyReducer from "./story.slice";
import messageReducer from "./message.Slice";
import socketReducer from "./socket.Slice";

const store = configureStore({
  reducer: {
    user: userReducer,
    post: postReducer,
    reel: reelReducer,
    story: storyReducer,
    message: messageReducer,
    socket: socketReducer,
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