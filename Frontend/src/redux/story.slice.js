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
      state.stories.push(action.payload);
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
    toggleLikeStory: (state, action) => {
      const { storyId, userId } = action.payload;
      const story = state.stories.find((s) => s._id === storyId);
      if (story) {
        story.likes = story.likes || [];
        const exists = story.likes.some((id) => (id._id || id).toString() === userId.toString());
        if (exists) {
          story.likes = story.likes.filter((id) => (id._id || id).toString() !== userId.toString());
        } else {
          story.likes.push(userId);
        }
      }
      if (state.activeStory && state.activeStory._id === storyId) {
        state.activeStory.likes = state.activeStory.likes || [];
        const exists = state.activeStory.likes.some((id) => (id._id || id).toString() === userId.toString());
        if (exists) {
          state.activeStory.likes = state.activeStory.likes.filter((id) => (id._id || id).toString() !== userId.toString());
        } else {
          state.activeStory.likes.push(userId);
        }
      }
    },
    updateStoryLikes: (state, action) => {
      const { storyId, likes } = action.payload;
      const story = state.stories.find((s) => s._id === storyId);
      if (story) {
        story.likes = likes;
      }
      if (state.activeStory && state.activeStory._id === storyId) {
        state.activeStory.likes = likes;
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
  toggleLikeStory,
  updateStoryLikes,
  setActiveStory,
  setStoryLoading,
  setStoryError,
  clearStories,
} = storySlice.actions;

export default storySlice.reducer;
