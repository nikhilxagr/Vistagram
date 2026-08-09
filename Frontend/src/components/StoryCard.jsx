import React from "react";
import dp from "../assets/dp.png";
import { FiPlus } from "react-icons/fi";
import { ClipLoader } from "react-spinners";

function StoryCard({
  ProfileImage,
  username,
  hasStory,
  isSeen = false,
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

  // Ring styling logic: Unseen -> Vibrant Gradient, Seen -> Gray Ring, No Story -> Dark Border
  const ringStyle = !hasStory
    ? "p-[2px] bg-gray-800 border border-gray-700/80"
    : isSeen
    ? "p-[2.5px] bg-gray-600/80 border border-gray-500/80 group-hover:scale-105"
    : "p-[2.5px] bg-gradient-to-tr from-[#F50087] via-rose-500 to-[#FFDD00] shadow-md group-hover:scale-105";

  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col items-center cursor-pointer group w-[72px] flex-shrink-0 select-none"
    >
      <div
        className={`relative flex items-center justify-center w-[68px] h-[68px] rounded-full transition-all duration-300 ${ringStyle}`}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-gray-950 border-2 border-black flex items-center justify-center">
          <img
            src={imageSrc}
            alt={username || "User avatar"}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Plus icon badge for Your Story */}
        {isYourStory && !hasStory && (
          <div
            onClick={handlePlusBadgeClick}
            className="absolute bottom-0 right-0 bg-blue-600 border-2 border-black p-1 rounded-full shadow-lg hover:bg-blue-500 hover:scale-110 transition cursor-pointer flex items-center justify-center z-20 translate-x-[2px] translate-y-[2px]"
          >
            {loading ? (
              <ClipLoader size={11} color="#ffffff" />
            ) : (
              <FiPlus size={12} className="text-white stroke-[3]" />
            )}
          </div>
        )}
      </div>

      <p className={`text-[11px] font-semibold truncate w-[68px] mt-1.5 text-center ${isSeen ? "text-gray-500" : "text-gray-200"}`}>
        {isYourStory ? "Your story" : username}
      </p>
    </div>
  );
}

export default StoryCard;