import { createSlice } from "@reduxjs/toolkit";

const storySlice = createSlice({
  name: "story",
  initialState: {
    stories: [],
    loading: false,
    error: null,
    activeStory: null,
  },
  reducers: {
    setStories: (state, action) => {
      state.stories = action.payload;
    },
    addStory: (state, action) => {
      state.stories.unshift(action.payload);
    },
    removeStory: (state, action) => {
      state.stories = state.stories.filter((s) => s._id !== action.payload);
    },
    markStoryViewed: (state, action) => {
      const { storyId, userId } = action.payload;
      const story = state.stories.find((s) => s._id === storyId);
      if (story && !story.viewers?.includes(userId)) {
        story.viewers = [...(story.viewers || []), userId];
      }
    },
    setActiveStory: (state, action) => {
      state.activeStory = action.payload;
    },
    setStoryLoading: (state, action) => {
      state.loading = action.payload;
    },
    setStoryError: (state, action) => {
      state.error = action.payload;
    },
    clearStories: (state) => {
      state.stories = [];
      state.activeStory = null;
      state.error = null;
    },
  },
});

export const {
  setStories,
  addStory,
  removeStory,
  markStoryViewed,
  setActiveStory,
  setStoryLoading,
  setStoryError,
  clearStories,
} = storySlice.actions;

export default storySlice.reducer;
