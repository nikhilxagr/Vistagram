import { createSlice } from '@reduxjs/toolkit';

const getInitialUserData = () => {
  try {
    const savedUser = localStorage.getItem("vistagram_user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (err) {
    return null;
  }
};

const initialUser = getInitialUserData();

const userSlice = createSlice({
  name: 'user',
  initialState: {
    userData: initialUser,
    loading: initialUser ? false : true,
    error: null,
    suggestedUsers: null,
    profileData: null,
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
      if (action.payload) {
        try {
          localStorage.setItem("vistagram_user", JSON.stringify(action.payload));
        } catch (err) {
          console.error("Failed to save user to localStorage", err);
        }
      } else {
        localStorage.removeItem("vistagram_user");
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearUserData: (state) => {
      state.userData = null;
      localStorage.removeItem("vistagram_user");
    },
    setSuggestedUsers: (state, action) => {
      state.suggestedUsers = action.payload;
    },
    setProfileData: (state, action) => {
      state.profileData = action.payload;
    }
  },
});

export const { setUserData, setLoading, setError, clearUserData, setSuggestedUsers, setProfileData } = userSlice.actions;
export default userSlice.reducer;