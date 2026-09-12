import { createSlice } from "@reduxjs/toolkit";

const getInitialSelectedUser = () => {
  try {
    const saved = localStorage.getItem("selectedUser");
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    return null;
  }
};

const messageSlice = createSlice({
  name: "message",
  initialState: {
    selectedUser: getInitialSelectedUser(),
    messages: [],
  },
  reducers: {
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
      try {
        if (action.payload) {
          localStorage.setItem("selectedUser", JSON.stringify(action.payload));
        } else {
          localStorage.removeItem("selectedUser");
        }
      } catch (err) {
        console.error("Failed to save selectedUser to localStorage:", err);
      }
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    updateMessageReaction: (state, action) => {
      const { messageId, reactions } = action.payload;
      const msg = state.messages.find(
        (m) => (m._id || m.id)?.toString() === messageId?.toString()
      );
      if (msg) {
        msg.reactions = reactions;
      }
    },
    deleteMessage: (state, action) => {
      const messageId = action.payload;
      state.messages = state.messages.filter(
        (m) => (m._id || m.id)?.toString() !== messageId?.toString()
      );
    },
  },
});

export const {
  setSelectedUser,
  setMessages,
  updateMessageReaction,
  deleteMessage,
} = messageSlice.actions;
export default messageSlice.reducer;