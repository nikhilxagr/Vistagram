import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dp from "../assets/dp.png";

function OtherUser({ user }) {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);

  if (!user) return null;

  return (
    <div className="w-full flex items-center justify-between py-2 border-b border-gray-900/60 last:border-none">
      <div className="flex items-center gap-3 overflow-hidden">
        <div
          className="w-11 h-11 rounded-full overflow-hidden border border-gray-800 flex-shrink-0 cursor-pointer"
          onClick={() => navigate(`/profile/${user.username || user.userName}`)}
        >
          <img
            src={user.profileImage || dp}
            alt={user.username}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="overflow-hidden">
          <div
            className="text-sm font-semibold text-white truncate cursor-pointer hover:underline"
            onClick={() => navigate(`/profile/${user.username || user.userName}`)}
          >
            {user.username || user.userName}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {user.name}
          </div>
        </div>
      </div>

      <button
        onClick={() => setFollowing(!following)}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex-shrink-0 ${
          following
            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
            : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-900/30"
        }`}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

export default OtherUser;
