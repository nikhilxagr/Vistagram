import React, { useState } from "react";
import logo from "../assets/logo.png";
import dp from "../assets/dp.png";
import { FaRegHeart } from "react-icons/fa6";
import { useSelector, useDispatch } from "react-redux";
import { clearUserData } from "../redux/userSlice";
import axios from "axios";
import { serverUrl } from "../App";
import { useNavigate } from "react-router-dom";
import OtherUser from "./OtherUser";
import useGetSuggestedUsers from "../hooks/getSuggestedUsers";
import NotificationPanel from "./NotificationPanel";

function LeftHome() {
  useGetSuggestedUsers();
  const { userData, suggestedUsers } = useSelector((state) => state.user);
  const { unreadCount } = useSelector((state) => state.notification);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogOut = async () => {
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

  const displayUsers = Array.isArray(suggestedUsers) ? suggestedUsers : [];

  return (
    <div className="w-[25%] hidden lg:block min-h-screen bg-black border-r border-gray-900 p-5">
      <div className="w-full flex items-center justify-between py-2 mb-6">
        <img
          src={logo}
          alt="Vistagram"
          className="h-10 w-auto scale-130 transform origin-left object-contain cursor-pointer hover:opacity-80 transition"
          onClick={() => navigate("/")}
          style={{ mixBlendMode: "screen" }}
        />

        {/* Heart Icon with Unread Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-2 rounded-full hover:bg-gray-900 transition cursor-pointer"
            aria-label="Notifications"
          >
            <FaRegHeart
              className={`w-5 h-5 transition ${
                showNotifications ? "text-red-500 scale-110" : "text-white hover:text-red-500"
              }`}
            />
            {/* Unread Count Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel Popover */}
          {showNotifications && (
            <NotificationPanel onClose={() => setShowNotifications(false)} />
          )}
        </div>
      </div>

      {/* Current User Card */}
      <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-900/40 border border-gray-800/80 mb-8">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className="w-12 h-12 rounded-full overflow-hidden border border-gray-700 flex-shrink-0 cursor-pointer"
            onClick={() => navigate(`/profile/${userData?.username}`)}
          >
            <img
              src={userData?.profileImage || dp}
              alt="Profile Picture"
              className="w-full h-full object-cover"
            />
          </div>
          <div
            className="overflow-hidden cursor-pointer"
            onClick={() => navigate(`/profile/${userData?.username}`)}
          >
            <div className="text-sm font-bold text-white truncate hover:underline">
              {userData?.username || userData?.userName || "User"}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {userData?.name || ""}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogOut}
          className="text-xs font-bold text-blue-500 hover:text-blue-400 transition cursor-pointer px-2 py-1 flex-shrink-0"
        >
          Log Out
        </button>
      </div>

      {/* Suggested Users */}
      <div className="w-full flex flex-col gap-3">
        <h2 className="text-white text-sm font-bold px-1 mb-1">Suggested Users</h2>
        <div className="flex flex-col gap-2">
          {displayUsers.length > 0 ? (
            displayUsers.map((user, index) => (
              <OtherUser key={user._id || index} user={user} />
            ))
          ) : (
            <p className="text-xs text-gray-500 px-1 font-medium">No suggestions right now</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeftHome;