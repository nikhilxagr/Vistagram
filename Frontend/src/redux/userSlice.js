import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    userData: null,
    loading: true,
    error: null,
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearUserData: (state) => {
      state.userData = null;
    },
  },
});

export const { setUserData, setLoading, setError, clearUserData } = userSlice.actions;
export default userSlice.reducer;