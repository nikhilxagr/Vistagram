import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import useGetCurrentUser from "./hooks/useGetCurrentUser";
import { ClipLoader } from "react-spinners";

export const serverUrl = "http://localhost:8000";

function App() {
  // Fetch current user on mount and sync to Redux store
  useGetCurrentUser();

  const { userData, loading } = useSelector((state) => state.user);

  // Show full screen loading spinner while checking authentication state
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
        path="/signup"
        element={!userData ? <SignUp /> : <Navigate to="/" />}
      />
      <Route
        path="/signin"
        element={!userData ? <SignIn /> : <Navigate to="/" />}
      />
      <Route
        path="/forgot-password"
        element={!userData ? <ForgotPassword /> : <Navigate to="/" />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;