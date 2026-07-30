import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearUserData } from "../redux/userSlice";
import logo2 from "../assets/logo2.png";
import axios from "axios";
import { serverUrl } from "../App";
import { useNavigate } from "react-router-dom";

function Home() {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await axios.post(
        `${serverUrl}/api/auth/signout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      dispatch(clearUserData());
      navigate("/signin");
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col items-center p-6">
      {/* Navbar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4 border-b border-gray-800 mb-10">
        <img
          src={logo2}
          alt="Vistagram"
          className="h-10 w-auto object-contain invert brightness-200"
        />
        <button
          onClick={handleSignOut}
          className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 font-semibold text-sm transition-all cursor-pointer shadow-md active:scale-95"
        >
          Sign Out
        </button>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-extrabold mb-4 text-white shadow-lg">
          {userData?.name ? userData.name.charAt(0).toUpperCase() : "V"}
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold mb-1">
          Welcome, {userData?.name || "User"}!
        </h1>
        <p className="text-gray-400 text-sm mb-6">@{userData?.username}</p>

        <div className="w-full bg-black/50 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3 text-left mb-6">
          <div className="flex justify-between border-b border-gray-800/80 pb-2">
            <span className="text-gray-400 text-sm">Full Name:</span>
            <span className="font-semibold text-sm">{userData?.name}</span>
          </div>
          <div className="flex justify-between border-b border-gray-800/80 pb-2">
            <span className="text-gray-400 text-sm">Username:</span>
            <span className="font-semibold text-sm">@{userData?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Email:</span>
            <span className="font-semibold text-sm">{userData?.email}</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
