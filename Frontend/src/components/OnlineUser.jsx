import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setSelectedUser } from "../redux/message.Slice";
import dp from "../assets/dp.png";

function OnlineUser({ user }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  if (!user) return null;

  const username = user.username || user.userName || "User";
  const profileImage = user.profileImage || dp;

  const handleOpenChat = () => {
    dispatch(setSelectedUser(user));
    navigate("/messageArea");
  };

  return (
    <div
      onClick={handleOpenChat}
      className="flex flex-col items-center gap-1.5 cursor-pointer group flex-shrink-0 select-none w-[64px]"
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-800 bg-gray-900 p-0.5 group-hover:scale-105 transition">
          <img
            src={profileImage}
            alt={username}
            className="w-full h-full object-cover rounded-full"
          />
        </div>

        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full shadow-md" />
      </div>

      <span className="text-[11px] text-gray-300 font-semibold truncate w-full text-center group-hover:text-white transition">
        {username}
      </span>
    </div>
  );
}

export default OnlineUser;