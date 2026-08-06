import { createSlice } from "@reduxjs/toolkit";

const postSlice = createSlice({
  name: "post",
  initialState: {
    posts: [],
    loading: false,
    error: null,
    selectedPost: null,
  },
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload;
    },
    addPost: (state, action) => {
      state.posts.unshift(action.payload);
    },
    removePost: (state, action) => {
      state.posts = state.posts.filter((p) => p._id !== action.payload);
    },
    updatePost: (state, action) => {
      const index = state.posts.findIndex((p) => p._id === action.payload._id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
    },
    toggleLikePost: (state, action) => {
      const { postId, userId } = action.payload;
      const post = state.posts.find((p) => p._id === postId);
      if (post) {
        const liked = post.likes?.includes(userId);
        if (liked) {
          post.likes = post.likes.filter((id) => id !== userId);
        } else {
          post.likes = [...(post.likes || []), userId];
        }
      }
    },
    addCommentToPost: (state, action) => {
      const { postId, comment } = action.payload;
      const post = state.posts.find((p) => p._id === postId);
      if (post) {
        post.comments = [...(post.comments || []), comment];
      }
    },
    setSelectedPost: (state, action) => {
      state.selectedPost = action.payload;
    },
    setPostLoading: (state, action) => {
      state.loading = action.payload;
    },
    setPostError: (state, action) => {
      state.error = action.payload;
    },
    clearPosts: (state) => {
      state.posts = [];
      state.selectedPost = null;
      state.error = null;
    },
  },
});

export const {
  setPosts,
  addPost,
  removePost,
  updatePost,
  toggleLikePost,
  addCommentToPost,
  setSelectedPost,
  setPostLoading,
  setPostError,
  clearPosts,
} = postSlice.actions;

export default postSlice.reducer;
