import React from "react";
import { GoHomeFill } from "react-icons/go";
import { FiSearch, FiSend, FiPlusSquare } from "react-icons/fi";
import { useSelector } from "react-redux";
import dp from "../assets/dp.png";
import { useNavigate } from "react-router-dom";

function Nav() {
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);

  const handleProfileClick = () => {
    const targetUsername = userData?.username || userData?.userName || userData?._id;
    if (targetUsername) {
      navigate(`/profile/${targetUsername}`);
    } else {
      navigate("/signin");
    }
  };

  return (
    <div className="w-[94%] sm:w-[440px] h-[58px] bg-black/95 backdrop-blur-md flex justify-around items-center fixed bottom-[16px] left-1/2 -translate-x-1/2 rounded-full shadow-2xl shadow-black z-[100] border border-gray-800 px-3">
      {/* 1. Home */}
      <div
        className="cursor-pointer hover:scale-110 transition p-2"
        onClick={() => navigate("/")}
        title="Home"
      >
        <GoHomeFill className="text-white w-[24px] h-[24px]" />
      </div>

      {/* 2. Reels */}
      <div
        className="cursor-pointer hover:scale-110 transition p-2 flex items-center justify-center"
        onClick={() => navigate("/reels")}
        title="Reels"
      >
        <svg
          className="w-[23px] h-[23px] text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="5.5" ry="5.5" />
          <polygon points="10 8.5 15.5 12 10 15.5" fill="currentColor" stroke="none" />
        </svg>
      </div>

      {/* 3. + Post */}
      <div
        className="cursor-pointer hover:scale-110 transition p-2 flex items-center justify-center"
        onClick={() => navigate("/upload")}
        title="Create Post, Story or Reel"
      >
        <FiPlusSquare className="text-white w-[25px] h-[25px]" />
      </div>

      {/* 4. Messages */}
      <div
        className="cursor-pointer hover:scale-110 transition p-2"
        onClick={() => navigate("/chat")}
        title="Messages"
      >
        <FiSend className="text-white w-[22px] h-[22px] -rotate-12" />
      </div>

      {/* 5. Search */}
      <div
        className="cursor-pointer hover:scale-110 transition p-2"
        onClick={() => navigate("/search")}
        title="Search"
      >
        <FiSearch className="text-white w-[23px] h-[23px]" />
      </div>

      {/* 6. Profile Avatar */}
      <div
        className="w-[27px] h-[27px] border border-gray-700 rounded-full cursor-pointer overflow-hidden group hover:scale-110 transition flex-shrink-0"
        onClick={handleProfileClick}
        title="Profile"
      >
        <img
          src={userData?.profileImage || dp}
          alt="Profile Picture"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

export default Nav;