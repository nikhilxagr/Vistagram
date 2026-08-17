import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    notifications: [],
    unreadCount: 0,
  },
  reducers: {
    setNotifications: (state, action) => {
      const raw = Array.isArray(action.payload) ? action.payload : [];
      const seen = new Set();
      const clean = [];
      for (const n of raw) {
        const senderId = (n.sender?._id || n.sender || "").toString();
        const targetId = (
          n.post?._id || n.post ||
          n.reel?._id || n.reel ||
          n.story?._id || n.story ||
          ""
        ).toString();
        const key = `${senderId}_${n.type}_${targetId}`;
        if (!seen.has(key)) {
          seen.add(key);
          clean.push(n);
        }
      }
      state.notifications = clean;
      state.unreadCount = clean.filter((n) => !n.isRead).length;
    },
    addNotification: (state, action) => {
      const newNotif = action.payload;
      if (!newNotif || !newNotif._id) return;

      const newSenderId = (newNotif.sender?._id || newNotif.sender || "").toString();
      const newTargetId = (
        newNotif.post?._id || newNotif.post ||
        newNotif.reel?._id || newNotif.reel ||
        newNotif.story?._id || newNotif.story ||
        ""
      ).toString();

      // Remove any existing notification matching same ID or same sender + type + target
      state.notifications = state.notifications.filter((n) => {
        if (n._id === newNotif._id) return false;
        const curSenderId = (n.sender?._id || n.sender || "").toString();
        const curTargetId = (
          n.post?._id || n.post ||
          n.reel?._id || n.reel ||
          n.story?._id || n.story ||
          ""
        ).toString();

        if (
          curSenderId === newSenderId &&
          n.type === newNotif.type &&
          curTargetId === newTargetId
        ) {
          return false;
        }
        return true;
      });

      state.notifications.unshift(newNotif);
      state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
    },
    removeNotification: (state, action) => {
      const { notificationId, senderId, type, postId, reelId, storyId } = action.payload || {};
      state.notifications = state.notifications.filter((n) => {
        if (notificationId && n._id === notificationId) return false;
        if (senderId && type) {
          const curSenderId = (n.sender?._id || n.sender || "").toString();
          const curPostId = (n.post?._id || n.post || "").toString();
          const curReelId = (n.reel?._id || n.reel || "").toString();
          const curStoryId = (n.story?._id || n.story || "").toString();

          if (
            curSenderId === senderId.toString() &&
            n.type === type &&
            ((postId && curPostId === postId.toString()) ||
             (reelId && curReelId === reelId.toString()) ||
             (storyId && curStoryId === storyId.toString()))
          ) {
            return false;
          }
        }
        return true;
      });
      state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
    },
    markNotificationRead: (state, action) => {
      const id = action.payload;
      const n = state.notifications.find((n) => n._id === id);
      if (n && !n.isRead) {
        n.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  removeNotification,
  markNotificationRead,
  markAllRead,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;