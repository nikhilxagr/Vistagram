import React from "react";
import dp from "../assets/dp.png";

function OtherUser({ user }) {
  if (!user) return null;

  return (
    <div className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-900/60 transition border border-gray-800/40">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-10 h-10 border border-gray-700 rounded-full cursor-pointer overflow-hidden flex-shrink-0">
          <img
            src={user.profileImage || dp}
            alt="Profile Picture"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="overflow-hidden">
          <div className="text-sm text-white font-semibold truncate">
            {user.username || user.userName}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {user.name}
          </div>
        </div>
      </div>
      <button className="text-blue-500 text-xs font-semibold hover:text-blue-400 transition cursor-pointer px-2 py-1">
        Follow
      </button>
    </div>
  );
}

export default OtherUser;
