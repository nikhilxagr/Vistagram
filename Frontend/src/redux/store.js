import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import postReducer from "./post.Slice";
import reelReducer from "./reel.Slice";
import storyReducer from "./story.slice";

const store = configureStore({
  reducer: {
    user: userReducer,
    post: postReducer,
    reel: reelReducer,
    story: storyReducer,
  },
});

export default store;