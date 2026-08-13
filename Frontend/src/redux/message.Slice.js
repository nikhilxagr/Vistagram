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
  },
});

export const { setSelectedUser, setMessages } = messageSlice.actions;
export default messageSlice.reducer;