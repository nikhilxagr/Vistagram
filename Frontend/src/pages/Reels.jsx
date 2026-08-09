import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { FiVideo, FiPlusSquare, FiArrowLeft } from "react-icons/fi";
import ReelCard from "../components/ReelCard";
import useGetAllReels from "../hooks/getAllReels";
import useGetAllPosts from "../hooks/getAllPost";

function Reels() {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);

  useGetAllReels();
  useGetAllPosts();

  const { reels, loading: reelsLoading } = useSelector((state) => state.reel);
  const { posts, loading: postsLoading } = useSelector((state) => state.post);

  const allReelVideos = React.useMemo(() => {
    const map = new Map();

    (reels || []).forEach((r) => {
      if (r && r._id) map.set(r._id.toString(), r);
    });

    (posts || []).forEach((p) => {
      if (p && p._id && p.mediaType === "video") {
        if (!map.has(p._id.toString())) {
          map.set(p._id.toString(), p);
        }
      }
    });

    return Array.from(map.values());
  }, [reels, posts]);

  // Automatically scroll to the selected video reel if passed in location.state
  useEffect(() => {
    const targetPostId = location.state?.postId || location.state?.reelId;
    if (!targetPostId || !allReelVideos || allReelVideos.length === 0) return;

    const timer = setTimeout(() => {
      const targetElement = document.getElementById(`reel-${targetPostId}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "auto" });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [allReelVideos, location.state]);

  const isLoading = (reelsLoading || postsLoading) && allReelVideos.length === 0;

  return (
    <div className="w-full h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center select-none">
      {/* Top Left Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-5 left-5 z-50 bg-black/50 backdrop-blur-md text-white p-2.5 rounded-full border border-gray-800 hover:bg-gray-900 transition cursor-pointer"
        aria-label="Go Back"
      >
        <FiArrowLeft size={18} />
      </button>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3">
          <ClipLoader size={36} color="#ffffff" />
          <p className="text-xs font-semibold text-gray-400">Loading Reels...</p>
        </div>
      ) : allReelVideos && allReelVideos.length > 0 ? (
        <div
          ref={containerRef}
          className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar relative"
        >
          {allReelVideos.map((reel) => (
            <div
              id={`reel-${reel._id}`}
              key={reel._id}
              className="w-full h-full snap-start flex-shrink-0"
            >
              <ReelCard reel={reel} />
            </div>
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