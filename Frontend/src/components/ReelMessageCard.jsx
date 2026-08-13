import React from "react";
import { useNavigate } from "react-router-dom";
import dp from "../assets/dp.png";
import { FiPlay } from "react-icons/fi";

function ReelMessageCard({ data }) {
  const navigate = useNavigate();

  if (!data?.reelId) return null;

  const handleClick = () => {
    navigate("/reels", { state: { reelId: data.reelId } });
  };

  const isVideo = data.mediaType === "video" || data.media?.includes(".mp4");

  return (
    <div
      onClick={handleClick}
      className="w-[220px] rounded-2xl overflow-hidden border border-gray-800 bg-gray-950 cursor-pointer group shadow-xl hover:border-gray-600 transition select-none"
    >
      {/* Media Preview */}
      <div className="relative w-full h-[290px] bg-black overflow-hidden">
        {isVideo ? (
          <video
            src={data.media}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={data.media}
            alt="Reel"
            className="w-full h-full object-cover"
          />
        )}

     
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

     
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 transition shadow-lg">
            <FiPlay size={20} className="text-white ml-1" />
          </div>
        </div>

        <div className="absolute top-2 left-3">
          <span className="text-[10px] font-bold text-white/80 tracking-widest uppercase drop-shadow">
            Reels
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-950 border-t border-gray-800/60">
        <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-700 bg-gray-900 flex-shrink-0">
          <img
            src={data.authorImage || dp}
            alt={data.authorUsername}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-xs font-semibold text-white truncate">
          @{data.authorUsername}
        </span>
      </div>
    </div>
  );
}

export default ReelMessageCard;
