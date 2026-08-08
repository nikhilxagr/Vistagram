import React from "react";
import dp from "../assets/dp.png";
import { FiPlus } from "react-icons/fi";

function StoryDp({ ProfileImage, username, story, hasStory = false, isYourStory = false, onClick, onPlusClick, loading = false }) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 cursor-pointer w-[72px] flex-shrink-0 select-none group"
    >
      <div className="relative">
        {/* Conditional Gradient Circular Ring */}
        <div
          className={`rounded-full transition-all duration-300 ${
            hasStory
              ? "p-[2.5px] bg-gradient-to-tr from-yellow-500 via-rose-500 to-purple-600 shadow-md group-hover:scale-105"
              : "p-[2px] bg-gray-800 border border-gray-700/60"
          }`}
        >
          <div className="w-[60px] h-[60px] border-2 border-black rounded-full overflow-hidden bg-gray-900 flex items-center justify-center">
            <img
              src={ProfileImage || dp}
              alt={username || "User avatar"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Plus (+) Icon Badge for Your Story */}
        {isYourStory && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onPlusClick) onPlusClick();
              else if (onClick) onClick();
            }}
            className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-black shadow-lg transition-transform hover:scale-110 cursor-pointer"
            aria-label="Add story"
          >
            <FiPlus className="text-xs stroke-[3]" />
          </button>
        )}
      </div>

      <p className="text-[11px] text-center truncate w-full text-gray-200 font-medium">
        {isYourStory ? "Your story" : username}
      </p>
    </div>
  );
}

export default StoryDp;