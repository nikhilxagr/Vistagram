import React from "react";
import dp from "../assets/dp.png";
import { FiPlus } from "react-icons/fi";
import { ClipLoader } from "react-spinners";

function StoryCard({
  ProfileImage,
  username,
  hasStory,
  onClick,
  isYourStory,
  onPlusClick,
  loading,
}) {
  const imageSrc = ProfileImage || dp;

  const handleCardClick = (e) => {
    if (isYourStory) {
      if (hasStory) {
        if (onClick) onClick(e);
      } else {
        if (onPlusClick) onPlusClick(e);
        else if (onClick) onClick(e);
      }
    } else {
      if (hasStory && onClick) onClick(e);
    }
  };

  const handlePlusBadgeClick = (e) => {
    e.stopPropagation();
    if (onPlusClick) onPlusClick(e);
    else if (onClick) onClick(e);
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col items-center cursor-pointer group w-[72px] flex-shrink-0 select-none"
    >
      <div
        className={`relative flex items-center justify-center w-[68px] h-[68px] rounded-full transition-all duration-300 ${
          hasStory
            ? "p-[2.5px] bg-gradient-to-tr from-[#F50087] via-rose-500 to-[#FFDD00] shadow-md group-hover:scale-105"
            : "p-[2px] bg-gray-800 border border-gray-700/80"
        }`}
      >
        {/* Inner avatar container */}
        <div className="w-full h-full rounded-full overflow-hidden bg-gray-950 border-2 border-black relative flex items-center justify-center">
          <img
            src={imageSrc}
            alt={username || "User avatar"}
            className="w-full h-full object-cover"
          />

          {/* Plus icon badge for Your Story */}
          {isYourStory && (
            <div
              onClick={handlePlusBadgeClick}
              className="absolute bottom-0 right-0 bg-blue-600 border-2 border-black p-[3px] rounded-full shadow-lg hover:bg-blue-500 hover:scale-110 transition cursor-pointer flex items-center justify-center z-10"
            >
              {loading ? (
                <ClipLoader size={12} color="#ffffff" />
              ) : (
                <FiPlus size={11} className="text-white stroke-[3]" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Label under avatar */}
      <p className="text-[11px] font-semibold text-gray-300 truncate w-[68px] mt-1.5 text-center">
        {isYourStory ? "Your story" : username}
      </p>
    </div>
  );
}

export default StoryCard;