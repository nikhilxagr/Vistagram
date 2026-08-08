import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import dp from "../assets/dp.png";
import useGetAllStories from "../hooks/getAllStories";
import { addStory } from "../redux/story.slice";
import { setUserData } from "../redux/userSlice";
import { ClipLoader } from "react-spinners";
import {
  FiArrowLeft,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiEye,
  FiSend,
} from "react-icons/fi";

function Story() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useGetAllStories();

  const { userData } = useSelector((state) => state.user);
  const { stories, loading } = useSelector((state) => state.story);

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentUserId = (userData?._id || userData?.id)?.toString();

  // Group stories by author
  const storyGroups = React.useMemo(() => {
    if (!stories || stories.length === 0) return [];

    const map = new Map();

    // Ensure my stories are first if they exist
    stories.forEach((s) => {
      const authorObj = typeof s.author === "object" && s.author !== null ? s.author : null;
      const authorId = (authorObj?._id || authorObj?.id || s.author)?.toString();

      if (authorId) {
        if (!map.has(authorId)) {
          map.set(authorId, {
            author: authorObj || {
              _id: authorId,
              name: authorId === currentUserId ? userData?.name || "You" : "User",
              username: authorId === currentUserId ? userData?.username || "you" : "user",
              profileImage: authorId === currentUserId ? userData?.profileImage : dp,
            },
            storiesList: [],
            isOwnGroup: authorId === currentUserId,
          });
        }
        map.get(authorId).storiesList.push(s);
      }
    });

    const groups = Array.from(map.values());
    // Move own group to top
    groups.sort((a, b) => (b.isOwnGroup ? 1 : 0) - (a.isOwnGroup ? 1 : 0));
    return groups;
  }, [stories, currentUserId, userData]);

  const initialGroupIdx = location.state?.groupIdx || 0;
  const [activeGroupIdx, setActiveGroupIdx] = useState(initialGroupIdx);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showViewersModal, setShowViewersModal] = useState(false);

  const currentGroup = storyGroups[activeGroupIdx] || storyGroups[0];
  const currentStoryList = currentGroup?.storiesList || [];
  const currentStory = currentStoryList[currentStoryIdx];

  // Auto advance timer effect
  useEffect(() => {
    if (!currentStoryList || currentStoryList.length === 0 || showViewersModal) return;

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentStoryIdx < currentStoryList.length - 1) {
            setCurrentStoryIdx((idx) => idx + 1);
            return 0;
          } else if (activeGroupIdx < storyGroups.length - 1) {
            setActiveGroupIdx((gIdx) => gIdx + 1);
            setCurrentStoryIdx(0);
            return 0;
          } else {
            navigate(-1);
            return 0;
          }
        }
        return prev + 2.5; // ~4 seconds per story
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeGroupIdx, currentStoryIdx, currentStoryList, storyGroups.length, showViewersModal, navigate]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("media", file);
    const isVideo = file.type.startsWith("video/");
    formData.append("mediaType", isVideo ? "video" : "image");

    try {
      const res = await axios.post(`${serverUrl}/api/story/upload`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.story) {
        dispatch(addStory(res.data.story));
        if (userData) {
          dispatch(
            setUserData({
              ...userData,
              story: [...(userData.story || []), res.data.story._id],
            })
          );
        }
        // Focus on own story group
        setActiveGroupIdx(0);
        setCurrentStoryIdx(0);
      }
    } catch (error) {
      console.error("Error uploading story from Story page:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isOwnStory = currentGroup?.isOwnGroup;

  return (
    <div className="w-full h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center select-none">
      {/* Hidden File Input for Story Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Top Left Back Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-5 left-5 z-50 bg-black/60 backdrop-blur-md text-white p-2.5 rounded-full border border-gray-800 hover:bg-gray-900 transition cursor-pointer"
        aria-label="Go Back"
      >
        <FiArrowLeft size={18} />
      </button>

      {/* Top Right Upload Story Action */}
      <button
        onClick={handleUploadClick}
        disabled={isUploading}
        className="absolute top-5 right-16 z-50 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg transition cursor-pointer disabled:opacity-50"
      >
        {isUploading ? (
          <ClipLoader size={14} color="#ffffff" />
        ) : (
          <>
            <FiPlus size={14} className="stroke-[3]" />
            <span>Add Story</span>
          </>
        )}
      </button>

      {/* Top Right Close Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-5 right-5 z-50 bg-black/60 backdrop-blur-md text-white p-2.5 rounded-full border border-gray-800 hover:bg-gray-900 transition cursor-pointer"
      >
        <FiX size={18} />
      </button>

      {loading && storyGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3">
          <ClipLoader size={36} color="#ffffff" />
          <p className="text-xs font-semibold text-gray-400">Loading Stories...</p>
        </div>
      ) : currentStory ? (
        <div className="relative w-full max-w-md h-full max-h-[94vh] md:rounded-2xl overflow-hidden bg-gray-950 flex flex-col items-center justify-center border border-gray-900 shadow-2xl">
          {/* Top Multi-segment Progress Bar */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
            {currentStoryList.map((s, idx) => (
              <div
                key={s._id || idx}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{
                    width:
                      idx < currentStoryIdx
                        ? "100%"
                        : idx === currentStoryIdx
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Author Header */}
          <div className="absolute top-7 left-4 right-4 z-30 flex items-center justify-between">
            <div
              onClick={() =>
                navigate(
                  `/profile/${
                    currentGroup?.author?.username || currentGroup?.author?.userName || "user"
                  }`
                )
              }
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-white/80 shadow">
                <img
                  src={currentGroup?.author?.profileImage || dp}
                  alt="Author"
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white drop-shadow group-hover:underline">
                  {currentGroup?.author?.username || currentGroup?.author?.name || "User"}
                </span>
                <span className="text-[10px] text-gray-300 font-medium drop-shadow">
                  Active story
                </span>
              </div>
            </div>
          </div>

          {/* Media Player */}
          <div className="w-full h-full flex items-center justify-center relative select-none">
            {currentStory.mediaType === "video" ? (
              <video
                src={currentStory.media}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            ) : (
              <img
                src={currentStory.media}
                alt="Story content"
                className="w-full h-full object-cover"
              />
            )}

            {/* Left Nav Button */}
            <button
              onClick={() => {
                if (currentStoryIdx > 0) {
                  setCurrentStoryIdx((idx) => idx - 1);
                } else if (activeGroupIdx > 0) {
                  setActiveGroupIdx((gIdx) => gIdx - 1);
                  setCurrentStoryIdx(0);
                }
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2.5 rounded-full backdrop-blur-sm transition"
            >
              <FiChevronLeft size={20} />
            </button>

            {/* Right Nav Button */}
            <button
              onClick={() => {
                if (currentStoryIdx < currentStoryList.length - 1) {
                  setCurrentStoryIdx((idx) => idx + 1);
                } else if (activeGroupIdx < storyGroups.length - 1) {
                  setActiveGroupIdx((gIdx) => gIdx + 1);
                  setCurrentStoryIdx(0);
                } else {
                  navigate(-1);
                }
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2.5 rounded-full backdrop-blur-sm transition"
            >
              <FiChevronRight size={20} />
            </button>
          </div>

          {/* Bottom Controls / Viewers Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between">
            {isOwnStory ? (
              <button
                onClick={() => setShowViewersModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-gray-800 text-white text-xs font-semibold hover:bg-black/80 transition cursor-pointer"
              >
                <FiEye size={16} />
                <span>{currentStory.viewers?.length || 0} Viewers</span>
              </button>
            ) : (
              <div className="flex-1 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-gray-800 rounded-full px-4 py-2 text-white">
                <input
                  type="text"
                  placeholder={`Send message to ${
                    currentGroup?.author?.username || "user"
                  }...`}
                  className="flex-1 bg-transparent text-xs outline-none text-white placeholder-gray-400"
                />
                <button className="text-blue-500 hover:text-blue-400 p-1 cursor-pointer">
                  <FiSend size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-6 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4 text-gray-400">
            <FiPlus size={32} />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">No Active Stories</h2>
          <p className="text-xs text-gray-400 mb-6">
            Share a story with your followers on Vistagram!
          </p>
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            <FiPlus size={16} className="stroke-[3]" />
            Upload Story
          </button>
        </div>
      )}

      {/* Story Viewers Modal */}
      {showViewersModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end">
          <div className="w-full max-w-md mx-auto bg-gray-950 text-white rounded-t-3xl border-t border-gray-800 p-5 max-h-[60%] flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FiEye size={16} />
                Story Viewers ({currentStory?.viewers?.length || 0})
              </h3>
              <button
                onClick={() => setShowViewersModal(false)}
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 no-scrollbar">
              {currentStory?.viewers && currentStory.viewers.length > 0 ? (
                currentStory.viewers.map((viewer, idx) => {
                  const vUser = typeof viewer === "object" ? viewer : {};
                  const vUsername = vUser.username || vUser.name || "user";
                  const vImage = vUser.profileImage || dp;

                  return (
                    <div
                      key={vUser._id || idx}
                      className="flex items-center justify-between text-xs text-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 bg-gray-900">
                          <img src={vImage} alt={vUsername} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-semibold">{vUsername}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 py-8 text-center">
                  No viewers yet. People who view your story will show up here!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Story;