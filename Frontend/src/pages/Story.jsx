import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import dp from "../assets/dp.png";
import useGetAllStories from "../hooks/getAllStories";
import { addStory, removeStory, toggleLikeStory } from "../redux/story.slice";
import { setUserData } from "../redux/userSlice";
import { ClipLoader } from "react-spinners";
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import {
  FiArrowLeft,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiEye,
  FiSend,
  FiVolume2,
  FiVolumeX,
  FiTrash2,
  FiMusic,
} from "react-icons/fi";
import StoryComposerModal from "../components/StoryComposerModal";

function Story() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useGetAllStories();

  const { userData } = useSelector((state) => state.user);
  const { stories, loading } = useSelector((state) => state.story);

  const fileInputRef = useRef(null);
  const storyVideoRef = useRef(null);
  const storyMusicAudioRef = useRef(new Audio());
  const lastTapRef = useRef(0);

  const [composerFile, setComposerFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);

  const currentUserId = (userData?._id || userData?.id)?.toString();

  // Group stories by author
  const storyGroups = React.useMemo(() => {
    if (!stories || stories.length === 0) return [];

    const map = new Map();

    stories.forEach((s) => {
      const authorObj = typeof s.author === "object" && s.author !== null ? s.author : null;
      const authorId = (authorObj?._id || authorObj?.id || s.author)?.toString();

      if (authorId) {
        if (!map.has(authorId)) {
          const isOwn = authorId === currentUserId;
          map.set(authorId, {
            author: authorObj || {
              _id: authorId,
              name: isOwn ? userData?.name || "You" : "User",
              username: isOwn ? userData?.username || "you" : "user",
              profileImage: isOwn ? userData?.profileImage : dp,
            },
            storiesList: [],
            isOwnGroup: isOwn,
          });
        }
        map.get(authorId).storiesList.push(s);
      }
    });

    const groups = Array.from(map.values());
    groups.forEach((g) => {
      g.storiesList.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date || 0).getTime();
        const timeB = new Date(b.createdAt || b.date || 0).getTime();
        return timeA - timeB;
      });
    });
    groups.sort((a, b) => (b.isOwnGroup ? 1 : 0) - (a.isOwnGroup ? 1 : 0));
    return groups;
  }, [stories, currentUserId, userData]);

  const initialGroupIdx = location.state?.groupIdx || 0;
  const [activeGroupIdx, setActiveGroupIdx] = useState(initialGroupIdx);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [localViewersMap, setLocalViewersMap] = useState({});

  const currentGroup = storyGroups[activeGroupIdx] || storyGroups[0];
  const currentStoryList = currentGroup?.storiesList || [];
  const currentStory = currentStoryList[currentStoryIdx];
  const isOwnStory = Boolean(currentGroup?.isOwnGroup);

  // Filter out story author & current user from viewers list
  const filteredViewers = React.useMemo(() => {
    const storyViewers = localViewersMap[currentStory?._id] || currentStory?.viewers;
    if (!storyViewers) return [];
    const authorId = (currentStory?.author?._id || currentStory?.author || "").toString();
    return storyViewers.filter((viewer) => {
      const vUser = typeof viewer === "object" ? viewer : {};
      const vId = (vUser._id || vUser.id || viewer)?.toString();
      return vId && vId !== authorId && vId !== currentUserId;
    });
  }, [currentStory, localViewersMap, currentUserId]);

  useEffect(() => {
    if (storyGroups.length > 0 && activeGroupIdx >= storyGroups.length) {
      setActiveGroupIdx(0);
    }
  }, [storyGroups.length, activeGroupIdx]);

  // Handle view tracking when a user watches a story
  useEffect(() => {
    if (!currentStory?._id) return;

    try {
      const seenStored = JSON.parse(localStorage.getItem("vistagram_seen_stories") || "[]");
      if (!seenStored.includes(currentStory._id)) {
        seenStored.push(currentStory._id);
        localStorage.setItem("vistagram_seen_stories", JSON.stringify(seenStored));
      }
    } catch (e) {
      console.error(e);
    }

    const recordView = async () => {
      try {
        const res = await axios.put(
          `${serverUrl}/api/story/${currentStory._id}/view`,
          {},
          { withCredentials: true }
        );
        if (res.data?.viewers) {
          setLocalViewersMap((prev) => ({
            ...prev,
            [currentStory._id]: res.data.viewers,
          }));
        }
      } catch (err) {
        console.error("Error recording story view:", err);
      }
    };

    recordView();
  }, [currentStory?._id]);

  const goToNextStory = () => {
    if (currentStoryIdx < currentStoryList.length - 1) {
      setCurrentStoryIdx((idx) => idx + 1);
      setProgress(0);
    } else if (activeGroupIdx < storyGroups.length - 1) {
      setActiveGroupIdx((gIdx) => gIdx + 1);
      setCurrentStoryIdx(0);
      setProgress(0);
    } else {
      navigate(-1);
    }
  };

  const goToPrevStory = () => {
    if (currentStoryIdx > 0) {
      setCurrentStoryIdx((idx) => idx - 1);
      setProgress(0);
    } else if (activeGroupIdx > 0) {
      setActiveGroupIdx((gIdx) => gIdx - 1);
      setCurrentStoryIdx(0);
      setProgress(0);
    }
  };

  // Support Keyboard Left / Right Arrow navigation

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        goToNextStory();
      } else if (e.key === "ArrowLeft") {
        goToPrevStory();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStoryIdx, activeGroupIdx, currentStoryList.length, storyGroups.length]);

  useEffect(() => {
    if (
      !currentStory ||
      currentStory.mediaType === "video" ||
      !currentStoryList ||
      currentStoryList.length === 0 ||
      showViewersModal ||
      isPaused ||
      isUploading ||
      Boolean(composerFile)
    )
      return;

    const durationSec = currentStory?.music?.duration || 10;
    const intervalStep = (durationSec * 1000) / 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNextStory();
          return 0;
        }
        return prev + 1;
      });
    }, intervalStep);

    return () => clearInterval(interval);
  }, [currentStory, activeGroupIdx, currentStoryIdx, currentStoryList, storyGroups.length, showViewersModal, isPaused, isUploading, composerFile]);

  const handleVideoTimeUpdate = () => {
    if (isPaused || isUploading || Boolean(composerFile)) return;
    const video = storyVideoRef.current;
    if (!video || !video.duration) return;
    const percent = (video.currentTime / video.duration) * 100;
    setProgress(percent);
  };

  const handleVideoEnded = () => {
    if (isPaused || isUploading || Boolean(composerFile)) return;
    goToNextStory();
  };

  // Synchronize background music playback with story
  useEffect(() => {
    const audio = storyMusicAudioRef.current;
    if (composerFile) {
      audio.pause();
      if (storyVideoRef.current) {
        storyVideoRef.current.pause();
      }
      return;
    }

    if (currentStory?.music?.audioUrl) {
      audio.src = currentStory.music.audioUrl;
      audio.currentTime = 0;
      audio.muted = isMuted;
      if (!isPaused && !isUploading && !composerFile) {
        audio.play().catch((err) => console.log("Story audio playback:", err));
      }
    } else {
      audio.pause();
      audio.src = "";
    }

    return () => {
      audio.pause();
    };
  }, [currentStory, isMuted, isUploading, composerFile, isPaused]);

  useEffect(() => {
    setProgress(0);
    setShowViewersModal(false);
  }, [activeGroupIdx, currentStoryIdx]);

  useEffect(() => {
    if (!isOwnStory && showViewersModal) {
      setShowViewersModal(false);
    }
  }, [isOwnStory, showViewersModal]);

  const handlePressStart = () => {
    setIsPaused(true);
    if (storyVideoRef.current) {
      storyVideoRef.current.pause();
    }
    if (storyMusicAudioRef.current && currentStory?.music?.audioUrl) {
      storyMusicAudioRef.current.pause();
    }
  };

  const handlePressEnd = () => {
    setIsPaused(false);
    if (storyVideoRef.current) {
      storyVideoRef.current.play().catch(() => {});
    }
    if (storyMusicAudioRef.current && currentStory?.music?.audioUrl) {
      storyMusicAudioRef.current.play().catch(() => {});
    }
  };

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (storyVideoRef.current) {
      storyVideoRef.current.muted = nextMuted;
    }
    if (storyMusicAudioRef.current) {
      storyMusicAudioRef.current.muted = nextMuted;
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setComposerFile(file);
    e.target.value = "";
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePublishComposer = async (file, musicData) => {
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);
    setIsPaused(true);
    if (storyVideoRef.current) {
      storyVideoRef.current.pause();
    }
    if (storyMusicAudioRef.current) {
      storyMusicAudioRef.current.pause();
    }

    const isVideo = Boolean(
      file.type?.startsWith("video/") ||
      file.name?.match(/\.(mp4|mov|webm|mkv|3gp|avi|m4v)$/i)
    );

    const formData = new FormData();
    formData.append("media", file);
    formData.append("mediaType", isVideo ? "video" : "image");
    if (musicData) {
      formData.append("music", JSON.stringify(musicData));
    }

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
        setUploadSuccess(true);
        await new Promise((resolve) => setTimeout(resolve, 800));
        setProgress(0);
        setActiveGroupIdx(0);
        setCurrentStoryIdx(0);
      }
    } catch (error) {
      console.error("Error uploading story from Story page:", error);
    } finally {
      setIsUploading(false);
      setUploadSuccess(false);
      setIsPaused(false);
    }
  };

  const handleDeleteStory = async (e) => {
    if (e) e.stopPropagation();
    if (!currentStory?._id || isDeleting) return;
    setIsDeleting(true);

    try {
      await axios.delete(`${serverUrl}/api/story/delete/${currentStory._id}`, {
        withCredentials: true,
      });

      dispatch(removeStory(currentStory._id));

      if (currentStoryList.length > 1) {
        if (currentStoryIdx > 0) {
          setCurrentStoryIdx((idx) => idx - 1);
        }
      } else {
        navigate(-1);
      }
    } catch (err) {
      console.error("Error deleting story:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const isCurrentStoryLiked = React.useMemo(() => {
    if (!currentStory?.likes || !currentUserId) return false;
    return currentStory.likes.some(
      (id) => (id._id || id || "").toString() === currentUserId.toString()
    );
  }, [currentStory?.likes, currentUserId]);

  const handleLikeStory = async (e) => {
    if (e) e.stopPropagation();
    if (!currentStory?._id || !currentUserId) return;

    dispatch(toggleLikeStory({ storyId: currentStory._id, userId: currentUserId }));
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 900);

    try {
      await axios.put(
        `${serverUrl}/api/story/${currentStory._id}/like`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Error liking story:", err);
      dispatch(toggleLikeStory({ storyId: currentStory._id, userId: currentUserId }));
    }
  };

  return (
    <div className="w-full h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*"
        className="hidden"
      />

      {loading && storyGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3">
          <ClipLoader size={36} color="#ffffff" />
          <p className="text-xs font-semibold text-gray-400">Loading Stories...</p>
        </div>
      ) : currentStory ? (
        <div className="relative w-full max-w-lg h-full max-h-screen md:rounded-2xl overflow-hidden bg-black flex flex-col items-center justify-between border-0 md:border border-gray-900 shadow-2xl transition-all duration-300">
          
        
          <div className={`relative w-full transition-all duration-300 ${showViewersModal ? "h-[46%]" : "h-full"}`}>
           
            <div
              className={`absolute top-2 left-2 right-2 z-40 flex items-center gap-1.5 transition-opacity duration-200 ${
                isPaused ? "opacity-0" : "opacity-100"
              }`}
            >
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

            <div
              className={`absolute top-5 left-3 right-3 z-40 flex items-center justify-between transition-opacity duration-200 ${
                isPaused ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="flex items-center gap-2 max-w-[65%] min-w-0">
                <button
                  onClick={() => navigate(-1)}
                  className="bg-black/50 backdrop-blur-md text-white p-1.5 rounded-full border border-white/10 hover:bg-black/70 transition cursor-pointer flex-shrink-0"
                  aria-label="Go Back"
                >
                  <FiArrowLeft size={16} />
                </button>

                <div
                  onClick={() =>
                    navigate(
                      `/profile/${
                        currentGroup?.author?.username || currentGroup?.author?.userName || "user"
                      }`
                    )
                  }
                  className="flex items-center gap-2.5 cursor-pointer group min-w-0"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/80 shadow flex-shrink-0">
                    <img
                      src={currentGroup?.author?.profileImage || dp}
                      alt="Author"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-xs font-bold text-white drop-shadow group-hover:underline truncate max-w-[130px] sm:max-w-[180px]">
                      {currentGroup?.author?.username || currentGroup?.author?.name || "User"}
                    </span>
                    {currentStory?.music?.title ? (
                      <div className="flex items-center gap-1 text-[10px] text-pink-300 font-medium truncate drop-shadow max-w-[140px] sm:max-w-[200px]">
                        <FiMusic size={10} className="text-pink-400 flex-shrink-0" />
                        <span className="truncate">
                          {currentStory.music.title} • {currentStory.music.artist}
                        </span>
                        {!isMuted && !isPaused && (
                          <div className="flex items-center gap-0.5 ml-0.5 flex-shrink-0">
                            <span className="w-0.5 h-2 bg-pink-400 animate-pulse rounded-full" />
                            <span className="w-0.5 h-3 bg-pink-400 animate-pulse delay-75 rounded-full" />
                            <span className="w-0.5 h-1.5 bg-pink-400 animate-pulse delay-150 rounded-full" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[9px] text-gray-300 font-medium drop-shadow">
                        Active story
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {currentUserId && (
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className={`bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg transition cursor-pointer active:scale-95 ${
                      isUploading ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    {isUploading ? (
                      <ClipLoader size={12} color="#ffffff" />
                    ) : (
                      <>
                        <FiPlus size={13} className="stroke-[3]" />
                        <span>Add Story</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={handleFileSelect}
                    />
                  </label>
                )}

                {/* Sound Mute / Unmute Toggle */}
                <button
                  onClick={toggleMute}
                  className="bg-black/50 backdrop-blur-md text-white p-1.5 rounded-full border border-white/10 hover:bg-black/70 transition cursor-pointer"
                  aria-label="Toggle Mute"
                >
                  {isMuted ? <FiVolumeX size={15} /> : <FiVolume2 size={15} />}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => navigate(-1)}
                  className="bg-black/50 backdrop-blur-md text-white p-1.5 rounded-full border border-white/10 hover:bg-black/70 transition cursor-pointer"
                  aria-label="Close Story"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {/* Media Player with Long Press Hold Event Handlers */}
            <div
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              className="w-full h-full flex items-center justify-center relative select-none cursor-pointer overflow-hidden bg-black"
            >
              {currentStory.mediaType === "video" ||
              currentStory.media?.match(/\.(mp4|mov|webm|mkv|3gp|avi|m4v)(\?.*)?$/i) ||
              currentStory.media?.includes("/video/upload/") ? (
                <video
                  ref={storyVideoRef}
                  key={currentStory._id || currentStory.media}
                  src={currentStory.media}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                  muted={isMuted}
                  onLoadedMetadata={(e) => {
                    e.target.play().catch(() => {});
                  }}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={handleVideoEnded}
                />
              ) : (
                <img
                  src={currentStory.media}
                  alt="Story content"
                  className="w-full h-full object-contain"
                />
              )}

              
              {showHeartPop && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in duration-200">
                  <div className="relative flex items-center justify-center">
                    <FaHeart className="text-red-500 text-8xl drop-shadow-[0_0_30px_rgba(239,68,68,0.9)] animate-bounce" />
                    <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-60 pointer-events-none">
                      <FaHeart className="text-red-500 text-8xl" />
                    </div>
                  </div>
                </div>
              )}

              {/* Positioned Instagram Music Sticker */}
              {currentStory?.music?.title && currentStory?.music?.stickerPos && (
                <div
                  style={{
                    left: `${currentStory.music.stickerPos.x}%`,
                    top: `${currentStory.music.stickerPos.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className={`absolute z-20 pointer-events-none select-none transition-opacity duration-200 ${
                    isPaused ? "opacity-0" : "opacity-100"
                  }`}
                >
                  <div className="bg-black/75 backdrop-blur-md border border-white/25 rounded-2xl p-2.5 flex items-center gap-3 shadow-2xl max-w-xs pointer-events-none">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 shadow-md">
                      <img
                        src={currentStory.music.coverImage || dp}
                        alt={currentStory.music.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col text-left min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white truncate max-w-[140px]">
                          {currentStory.music.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-300 truncate max-w-[120px]">
                          {currentStory.music.artist}
                        </span>
                        {!isMuted && !isPaused && (
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <span className="w-0.5 h-2 bg-pink-400 animate-pulse rounded-full" />
                            <span className="w-0.5 h-3 bg-pink-400 animate-pulse delay-75 rounded-full" />
                            <span className="w-0.5 h-1.5 bg-pink-400 animate-pulse delay-150 rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

         
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevStory();
                }}
                className="absolute left-0 top-0 w-1/3 h-full z-20 cursor-pointer"
              />


              <div
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextStory();
                }}
                className="absolute right-0 top-0 w-2/3 h-full z-20 cursor-pointer"
              />
            </div>
            
            {!showViewersModal && (
              <div
                className={`absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between transition-opacity duration-200 ${
                  isPaused ? "opacity-0" : "opacity-100"
                }`}
              >
                {isOwnStory ? (
                  <div className="w-full flex items-center justify-between">
                    <button
                      onClick={() => setShowViewersModal(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-gray-800 text-white text-xs font-semibold hover:bg-black/80 transition cursor-pointer"
                    >
                      <FiEye size={16} />
                      <span>{filteredViewers.length} Viewers</span>
                      {currentStory?.likes && currentStory.likes.length > 0 && (
                        <div className="flex items-center gap-1 ml-1 text-red-400 font-bold">
                          <FaHeart size={11} className="text-red-500" />
                          <span>{currentStory.likes.length}</span>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={handleDeleteStory}
                      disabled={isDeleting}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold backdrop-blur-md transition cursor-pointer disabled:opacity-50"
                    >
                      <FiTrash2 size={15} />
                      <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-2">
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

                    {/* Story Like Heart Button */}
                    <button
                      onClick={handleLikeStory}
                      className={`p-2.5 rounded-full backdrop-blur-md border transition cursor-pointer active:scale-90 flex-shrink-0 shadow-lg ${
                        isCurrentStoryLiked
                          ? "bg-red-500/20 border-red-500/40 text-red-500 hover:bg-red-500/30"
                          : "bg-black/60 border-gray-800 text-white hover:bg-black/80 hover:text-red-400"
                      }`}
                      title={isCurrentStoryLiked ? "Unlike Story" : "Like Story"}
                      aria-label="Like Story"
                    >
                      {isCurrentStoryLiked ? (
                        <FaHeart size={19} className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-in zoom-in-75 duration-150" />
                      ) : (
                        <FaRegHeart size={19} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {showViewersModal && (
            <div className="w-full h-[54%] bg-black border-t border-gray-800/80 flex flex-col px-5 py-4 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-gray-900">
                <div
                  onClick={() => setShowViewersModal(false)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5">
                    <FiEye size={16} className="text-white" />
                    <span className="text-xs font-semibold text-white tracking-wide">
                      {filteredViewers.length} Viewers
                    </span>
                  </div>

                  {currentStory?.likes && currentStory.likes.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 rounded-full shadow-sm">
                      <FaHeart size={11} className="text-red-500" />
                      <span className="text-xs font-bold text-red-400">
                        {currentStory.likes.length} Likes
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isOwnStory && (
                    <button
                      onClick={handleDeleteStory}
                      disabled={isDeleting}
                      className="text-red-500 hover:text-red-400 p-1 cursor-pointer text-xs flex items-center gap-1 font-semibold"
                    >
                      <FiTrash2 size={14} />
                      <span>Delete</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowViewersModal(false)}
                    className="text-gray-400 hover:text-white p-1 cursor-pointer"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

              {/* Viewers List */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pt-3 no-scrollbar">
                {filteredViewers && filteredViewers.length > 0 ? (
                  filteredViewers.map((viewer, idx) => {
                    const vUser = typeof viewer === "object" ? viewer : {};
                    const vId = (vUser._id || vUser.id || viewer)?.toString();
                    const vName = vUser.name || vUser.username || "User";
                    const vUsername = vUser.username || "user";
                    const vImage = vUser.profileImage || dp;

                    const hasLiked = currentStory?.likes?.some(
                      (id) => (id._id || id || "").toString() === (vId || "").toString()
                    );

                    return (
                      <div
                        key={vId || idx}
                        onClick={() => {
                          setShowViewersModal(false);
                          navigate(`/profile/${vUsername}`);
                        }}
                        className="flex items-center justify-between py-2 px-1 cursor-pointer group hover:bg-gray-900/60 rounded-xl transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-9 h-9 rounded-full flex-shrink-0">
                            <img
                              src={vImage}
                              alt={vUsername}
                              className="w-full h-full rounded-full object-cover border border-gray-800 group-hover:scale-105 transition"
                            />
                            {hasLiked && (
                              <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5">
                                <div className="bg-red-500 rounded-full p-0.5 shadow">
                                  <FaHeart size={8} className="text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col text-left justify-center min-w-0">
                            <span className="text-xs font-bold text-white leading-tight group-hover:underline truncate">
                              {vName}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium leading-none mt-0.5 truncate">
                              @{vUsername}
                            </span>
                          </div>
                        </div>

                        {hasLiked && (
                          <div className="flex items-center gap-1 text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ml-2">
                            <FaHeart size={10} className="text-red-500" />
                            <span>Liked</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-500 py-10 text-center">
                    No viewers yet. People who view your story will show up here!
                  </p>
                )}
              </div>
            </div>
          )}
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
          <label
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition shadow-lg cursor-pointer ${
              isUploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {isUploading ? (
              <ClipLoader size={16} color="#000000" />
            ) : (
              <FiPlus size={16} className="stroke-[3]" />
            )}
            <span>{isUploading ? "Uploading..." : "Upload Story"}</span>
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              disabled={isUploading}
              onChange={handleFileSelect}
            />
          </label>
        </div>
      )}

      {isUploading && (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-white p-6 animate-in fade-in duration-200 select-none">
          <div className="relative flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-transparent border-t-pink-500 border-r-purple-500 border-b-yellow-500 animate-spin" />
            <div className="w-20 h-20 rounded-full overflow-hidden absolute border-2 border-black bg-gray-900 shadow-2xl">
              <img
                src={userData?.profileImage || dp}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-1.5 mt-2">
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              {uploadSuccess ? "Story Added! 🎉" : "Adding to your story..."}
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              {uploadSuccess
                ? "Your story is now live"
                : "Uploading media to your story"}
            </p>
          </div>

          <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-300 ${
                uploadSuccess ? "w-full" : "w-2/3 animate-pulse"
              }`}
            />
          </div>
        </div>
      )}

      {/* Story Preview & Music Composer Modal */}
      <StoryComposerModal
        isOpen={Boolean(composerFile)}
        file={composerFile}
        onClose={() => setComposerFile(null)}
        onPublish={handlePublishComposer}
        currentUser={userData}
      />
    </div>
  );
}

export default Story;