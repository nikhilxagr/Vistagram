import React from "react";
import dp from "../assets/dp.png";

function StoryDp({ ProfileImage, username }) {
  return (
    <div className="flex flex-col items-center gap-1.5 cursor-pointer w-[72px] flex-shrink-0">
      <div className="p-0.5 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600">
        <div className="w-[60px] h-[60px] border-2 border-black rounded-full overflow-hidden bg-white">
          <img
            src={ProfileImage || dp}
            alt="Story DP"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <p className="text-xs text-center truncate w-full text-white font-medium">
        {username}
      </p>
    </div>
  );
}

export default StoryDp;