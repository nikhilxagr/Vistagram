import React from "react";
import logo from "../assets/logo.png";
import dp from "../assets/dp.png";
import { FaRegHeart } from "react-icons/fa6";
import { useSelector, useDispatch } from "react-redux";
import { clearUserData } from "../redux/userSlice";
import axios from "axios";
import { serverUrl } from "../App";
import { useNavigate } from "react-router-dom";
import OtherUser from "./OtherUser";

function LeftHome() {
  const { userData, suggestedUsers } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  return (
    <div className="w-[25%] hidden lg:block min-h-screen bg-black border-r border-gray-900 p-4">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between py-4 mb-4">
        <img src={logo} alt="Logo" className="w-[120px] object-contain" />
        <div>
          <FaRegHeart className="text-white w-[22px] h-[22px] cursor-pointer hover:text-red-500 transition" />
        </div>
      </div>

      {/* User Profile Summary */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-900/60 border border-gray-800/80 mb-6">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-700 flex-shrink-0">
          <img
            src={userData?.profileImage || dp}
            alt="Profile Picture"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="overflow-hidden">
          <div className="text-sm font-bold text-white truncate">
            {userData?.username || userData?.userName || "User"}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {userData?.name || ""}
          </div>
        </div>
      </div>

      {/* Log Out Button */}
      <div
        className="w-full text-center text-red-500 text-sm font-semibold cursor-pointer p-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition mb-6"
        onClick={handleLogOut}
      >
        Log Out
      </div>

      {/* Suggested Users Section */}
      <div className="w-full flex flex-col gap-3">
        <h2 className="text-white text-sm font-semibold px-1">Suggested Users</h2>
        {Array.isArray(suggestedUsers) && suggestedUsers.length > 0 ? (
          suggestedUsers.slice(0, 5).map((user, index) => (
            <OtherUser key={user._id || index} user={user} />
          ))
        ) : (
          <p className="text-xs text-gray-500 px-1">No suggested users found</p>
        )}
      </div>
    </div>
  );
}

export default LeftHome;