import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { ClipLoader } from "react-spinners";
import axios from "axios";

import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Upload from "./pages/Upload";
import Reels from "./pages/Reels";
import Story from "./pages/Story";
import Messages from "./pages/Messages";
import MessageArea from "./pages/MessageArea";
import Search from "./pages/Search";
import Notifications from "./pages/Notifications";
import PostDetail from "./pages/PostDetail";
import useGetCurrentUser from "./hooks/useGetCurrentUser";
import { setSocket, setOnlineUsers } from "./redux/socket.Slice";
import { setPostLikes, setPostComments } from "./redux/post.Slice";
import { addNotification, setNotifications } from "./redux/notification.Slice";

export const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

function App() {
  useGetCurrentUser();
  const dispatch = useDispatch();

  const { userData, loading } = useSelector((state) => state.user);
  const socket = useSelector((state) => state.socket?.socket);

  useEffect(() => {
    const userId = userData?._id || userData?.id;
    if (userId) {
      const socketIo = io(serverUrl, {
        withCredentials: true,
        query: {
          userId: userId.toString(),
        },
      });

      dispatch(setSocket(socketIo));

      socketIo.on("getOnlineUsers", (onlineUserIds) => {
        dispatch(setOnlineUsers(onlineUserIds));
      });

      socketIo.on("postLiked", (data) => {
        dispatch(setPostLikes(data));
      });

      socketIo.on("commentAdded", (data) => {
        dispatch(setPostComments(data));
      });

      socketIo.on("newNotification", (notification) => {
        dispatch(addNotification(notification));
      });

      return () => {
        socketIo.close();
        dispatch(setSocket(null));
      };
    } else {
      if (socket) {
        socket.close();
        dispatch(setSocket(null));
      }
    }
  }, [userData, dispatch]);

  // Fetch notifications on login
  useEffect(() => {
    const userId = userData?._id || userData?.id;
    if (!userId) return;
    axios.get(`${serverUrl}/api/users/notifications`, { withCredentials: true })
      .then((res) => dispatch(setNotifications(res.data?.notifications || [])))
      .catch(() => {});
  }, [userData?._id, dispatch]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <ClipLoader size={40} color="#ffffff" />
        <p className="text-sm font-medium tracking-wide">Loading Vistagram...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={userData ? <Home /> : <Navigate to="/signin" />}
      />
      <Route
        path="/profile/:userName"
        element={userData ? <Profile /> : <Navigate to="/signin" />}
      />
      <Route
        path="/edit-profile"
        element={userData ? <EditProfile /> : <Navigate to="/signin" />}
      />
      <Route
        path="/signup"
        element={!userData ? <SignUp /> : <Navigate to="/" />}
      />
      <Route
        path="/signin"
        element={!userData ? <SignIn /> : <Navigate to="/" />}
      />
      <Route
        path="/upload"
        element={userData ? <Upload /> : <Navigate to="/signin" />}
      />
      <Route
        path="/forgot-password"
        element={!userData ? <ForgotPassword /> : <Navigate to="/" />}
      />
      <Route
        path="/reels"
        element={userData ? <Reels /> : <Navigate to="/signin" />}
      />
      <Route
        path="/story"
        element={userData ? <Story /> : <Navigate to="/signin" />}
      />
      <Route
        path="/messages"
        element={userData ? <Messages /> : <Navigate to="/signin" />}
      />
      <Route
        path="/messageArea"
        element={userData ? <MessageArea /> : <Navigate to="/signin" />}
      />
      <Route
        path="/search"
        element={userData ? <Search /> : <Navigate to="/signin" />}
      />
      <Route
        path="/notifications"
        element={userData ? <Notifications /> : <Navigate to="/signin" />}
      />
      <Route
        path="/post/:postId"
        element={userData ? <PostDetail /> : <Navigate to="/signin" />}
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;