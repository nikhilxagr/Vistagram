import React, { useState, useEffect, useRef } from "react";
import { FiX, FiMusic, FiCheck, FiTrash2, FiVolume2, FiVolumeX } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import dp from "../assets/dp.png";
import StoryMusicPicker from "./StoryMusicPicker";

function StoryComposerModal({ isOpen, file, onClose, onPublish, currentUser }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [stickerPos, setStickerPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const musicAudioRef = useRef(new Audio());
  const dragStartRef = useRef({ startX: 0, startY: 0, initialPosX: 50, initialPosY: 50 });

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      const isVid = Boolean(
        file.type?.startsWith("video/") ||
        file.name?.match(/\.(mp4|mov|webm|mkv|3gp|avi|m4v)$/i)
      );
      setIsVideo(isVid);
      setStickerPos({ x: 50, y: 50 });
      setSelectedDuration(15);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
      setSelectedMusic(null);
    }
  }, [file]);

  // Dragging handlers (Mouse & Touch)
  const handleDragStart = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialPosX: stickerPos.x,
      initialPosY: stickerPos.y,
    };
  };

  useEffect(() => {
    const handleDragMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = clientX - dragStartRef.current.startX;
      const deltaY = clientY - dragStartRef.current.startY;

      const deltaPercentX = (deltaX / rect.width) * 100;
      const deltaPercentY = (deltaY / rect.height) * 100;

      const newX = Math.min(85, Math.max(15, dragStartRef.current.initialPosX + deltaPercentX));
      const newY = Math.min(80, Math.max(15, dragStartRef.current.initialPosY + deltaPercentY));

      setStickerPos({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove, { passive: false });
      window.addEventListener("touchend", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging]);

  useEffect(() => {
    const audio = musicAudioRef.current;
    if (selectedMusic?.audioUrl && isOpen) {
      audio.src = selectedMusic.audioUrl;
      audio.loop = true;
      audio.muted = isMuted;
      audio.play().catch((err) => console.log("Story composer audio autoplay:", err));
    } else {
      audio.pause();
      audio.src = "";
    }

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [selectedMusic, isOpen, isMuted]);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.muted = nextMuted;
    }
  };

  const handleShare = async () => {
    if (!file || isUploading) return;
    setIsUploading(true);
    musicAudioRef.current.pause();

    const musicPayload = selectedMusic
      ? {
          ...selectedMusic,
          duration: selectedDuration,
          stickerPos: stickerPos,
        }
      : null;

    try {
      await onPublish(file, musicPayload);
      onClose();
    } catch (err) {
      console.error("Error publishing story from composer:", err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen || !previewUrl) return null;

  return (
    <div className="fixed inset-0 z-[280] bg-black flex items-center justify-center select-none animate-in fade-in duration-200">
      {/* Main Story Preview Screen Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-md h-full md:h-[92vh] md:max-h-[850px] bg-black md:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
      >
        {/* Media Background Preview */}
        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center pointer-events-none">
          {isVideo ? (
            <video
              ref={videoRef}
              src={previewUrl}
              autoPlay
              loop
              playsInline
              muted={isMuted || Boolean(selectedMusic)}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={previewUrl}
              alt="Story Preview"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Top Floating Action Toolbar */}
        <div className="relative z-30 px-4 pt-4 flex items-center justify-between bg-gradient-to-b from-black/75 via-black/30 to-transparent pb-8">
          <button
            type="button"
            onClick={() => {
              musicAudioRef.current.pause();
              onClose();
            }}
            disabled={isUploading}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/80 flex items-center justify-center transition cursor-pointer"
          >
            <FiX size={20} />
          </button>

          <div className="flex items-center gap-2">
            {/* 15s / 30s Duration Selector */}
            {selectedMusic && !isVideo && (
              <div className="flex items-center bg-black/50 backdrop-blur-md border border-white/20 rounded-full p-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedDuration(15)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    selectedDuration === 15
                      ? "bg-white text-black shadow"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  15s
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDuration(30)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    selectedDuration === 30
                      ? "bg-white text-black shadow"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  30s
                </button>
              </div>
            )}

            {/* Mute/Unmute Button */}
            <button
              type="button"
              onClick={handleToggleMute}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/80 flex items-center justify-center transition cursor-pointer"
            >
              {isMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
            </button>

            {/* Music Picker Trigger Button */}
            <button
              type="button"
              onClick={() => setShowMusicPicker(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full backdrop-blur-md text-xs font-bold transition cursor-pointer shadow-lg ${
                selectedMusic
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  : "bg-black/60 text-white hover:bg-black/80 border border-white/20"
              }`}
            >
              <FiMusic size={15} />
              <span>{selectedMusic ? "Change Music" : "Add Music"}</span>
            </button>
          </div>
        </div>

        {selectedMusic && (
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            style={{
              left: `${stickerPos.x}%`,
              top: `${stickerPos.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            className={`absolute z-20 cursor-grab active:cursor-grabbing select-none touch-none transition-shadow duration-150 animate-in zoom-in-90 ${
              isDragging
                ? "scale-105 shadow-[0_0_30px_rgba(236,72,153,0.6)] ring-2 ring-pink-500/80 rounded-2xl"
                : ""
            }`}
          >
            <div className="bg-black/75 backdrop-blur-md border border-white/25 rounded-2xl p-2.5 flex items-center gap-3 shadow-2xl max-w-xs pointer-events-auto">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 shadow-md pointer-events-none">
                <img
                  src={selectedMusic.coverImage}
                  alt={selectedMusic.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col text-left min-w-0 flex-1 pointer-events-none">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white truncate max-w-[140px]">
                    {selectedMusic.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-gray-300 truncate max-w-[120px]">
                    {selectedMusic.artist}
                  </span>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <span className="w-0.5 h-2 bg-pink-400 animate-pulse rounded-full" />
                    <span className="w-0.5 h-3 bg-pink-400 animate-pulse delay-75 rounded-full" />
                    <span className="w-0.5 h-1.5 bg-pink-400 animate-pulse delay-150 rounded-full" />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMusic(null);
                }}
                className="text-gray-400 hover:text-red-400 p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
                title="Remove Music"
              >
                <FiTrash2 size={15} />
              </button>
            </div>
            <div className="text-center mt-1 text-[9px] text-white/60 font-medium tracking-wide pointer-events-none drop-shadow">
              Hold & Drag anywhere
            </div>
          </div>
        )}

        <div className="relative z-30 px-5 pb-6 pt-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-pink-500 bg-gray-900 shadow">
              <img
                src={currentUser?.profileImage || dp}
                alt="Your avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-none">Your Story</span>
              <span className="text-[10px] text-gray-400 mt-0.5">Share with followers</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShare}
            disabled={isUploading}
            className="px-6 py-3 rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition shadow-xl flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isUploading ? (
              <>
                <ClipLoader size={14} color="#000000" />
                <span>Sharing...</span>
              </>
            ) : (
              <>
                <FiCheck size={16} className="stroke-[3]" />
                <span>Share Story</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Music Picker Drawer Modal */}
      <StoryMusicPicker
        isOpen={showMusicPicker}
        onClose={() => setShowMusicPicker(false)}
        onSelectSong={(song) => setSelectedMusic(song)}
        selectedSong={selectedMusic}
      />
    </div>
  );
}

export default StoryComposerModal;
