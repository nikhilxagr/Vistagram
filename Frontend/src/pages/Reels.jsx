import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { FiVideo, FiPlusSquare, FiArrowLeft } from "react-icons/fi";
import ReelCard from "../components/ReelCard";
import useGetAllReels from "../hooks/getAllReels";

function Reels() {
  const navigate = useNavigate();
  useGetAllReels();

  const { reels, loading } = useSelector((state) => state.reel);

  return (
    <div className="w-full h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center">
      {/* Top Left Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-5 left-5 z-50 bg-black/50 backdrop-blur-md text-white p-2.5 rounded-full border border-gray-800 hover:bg-gray-900 transition cursor-pointer"
        aria-label="Go Back"
      >
        <FiArrowLeft size={18} />
      </button>

      {loading && (!reels || reels.length === 0) ? (
        <div className="flex flex-col items-center justify-center gap-3">
          <ClipLoader size={36} color="#ffffff" />
          <p className="text-xs font-semibold text-gray-400">Loading Reels...</p>
        </div>
      ) : reels && reels.length > 0 ? (
        <div className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar relative">
          {reels.map((reel) => (
            <ReelCard key={reel._id} reel={reel} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-6 max-w-sm">
          <div className="p-4 rounded-full bg-gray-900 border border-gray-800 mb-4 text-gray-400">
            <FiVideo size={36} />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">No Reels Available</h2>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            Be the first creator to share a Reel on Vistagram!
          </p>
          <button
            onClick={() => navigate("/upload")}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition shadow-lg cursor-pointer"
          >
            <FiPlusSquare size={16} />
            Upload Reel
          </button>
        </div>
      )}
    </div>
  );
}

export default Reels;