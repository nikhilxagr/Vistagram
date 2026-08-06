import { createSlice } from "@reduxjs/toolkit";

const reelSlice = createSlice({
  name: "reel",
  initialState: {
    reels: [],
    loading: false,
    error: null,
    selectedReel: null,
  },
  reducers: {
    setReels: (state, action) => {
      state.reels = action.payload;
    },
    addReel: (state, action) => {
      state.reels.unshift(action.payload);
    },
    removeReel: (state, action) => {
      state.reels = state.reels.filter((r) => r._id !== action.payload);
    },
    toggleLikeReel: (state, action) => {
      const { reelId, userId } = action.payload;
      const reel = state.reels.find((r) => r._id === reelId);
      if (reel) {
        const liked = reel.likes?.includes(userId);
        if (liked) {
          reel.likes = reel.likes.filter((id) => id !== userId);
        } else {
          reel.likes = [...(reel.likes || []), userId];
        }
      }
    },
    addCommentToReel: (state, action) => {
      const { reelId, comment } = action.payload;
      const reel = state.reels.find((r) => r._id === reelId);
      if (reel) {
        reel.comments = [...(reel.comments || []), comment];
      }
    },
    setSelectedReel: (state, action) => {
      state.selectedReel = action.payload;
    },
    setReelLoading: (state, action) => {
      state.loading = action.payload;
    },
    setReelError: (state, action) => {
      state.error = action.payload;
    },
    clearReels: (state) => {
      state.reels = [];
      state.selectedReel = null;
      state.error = null;
    },
  },
});

export const {
  setReels,
  addReel,
  removeReel,
  toggleLikeReel,
  addCommentToReel,
  setSelectedReel,
  setReelLoading,
  setReelError,
  clearReels,
} = reelSlice.actions;

export default reelSlice.reducer;
