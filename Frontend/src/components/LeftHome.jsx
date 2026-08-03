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

  const sampleUsers = [
    { _id: "s1", username: "ankush123", name: "Ankush", profileImage: "" },
    { _id: "s2", username: "theadityasahu__", name: "aditya sahu", profileImage: "" },
    { _id: "s3", username: "sahil_kumar", name: "Sahil Kumar", profileImage: "" },
    { _id: "s4", username: "gaurav_dev", name: "Gaurav Singh", profileImage: "" },
  ];

  const displayUsers =
    Array.isArray(suggestedUsers) && suggestedUsers.length >= 3
      ? suggestedUsers
      : Array.isArray(suggestedUsers) && suggestedUsers.length > 0
      ? [...suggestedUsers, ...sampleUsers.slice(0, 4 - suggestedUsers.length)]
      : sampleUsers;

  return (
    <div className="w-[25%] hidden lg:block min-h-screen bg-black border-r border-gray-900 p-5">
      <div className="w-full flex items-center justify-between py-2 mb-6">
        <img
          src={logo}
          alt="Vistagram"
          className="w-[120px] object-contain cursor-pointer hover:opacity-80 transition"
          onClick={() => navigate("/")}
        />
        <FaRegHeart className="text-white w-5 h-5 cursor-pointer hover:text-red-500 transition" />
      </div>

      <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-900/40 border border-gray-800/80 mb-8">
        <div className="flex items-center gap-3 overflow-hidden">
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

        <button
          onClick={handleLogOut}
          className="text-xs font-bold text-blue-500 hover:text-blue-400 transition cursor-pointer px-2 py-1 flex-shrink-0"
        >
          Log Out
        </button>
      </div>

      <div className="w-full flex flex-col gap-3">
        <h2 className="text-white text-sm font-bold px-1 mb-1">Suggested Users</h2>
        <div className="flex flex-col gap-2">
          {displayUsers.slice(0, 4).map((user, index) => (
            <OtherUser key={user._id || index} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default LeftHome;