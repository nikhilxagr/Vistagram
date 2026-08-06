import React, { useRef, useState, useEffect } from "react";
import {
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiX,
} from "react-icons/fi";

function VideoPlayer({ src, mediaType = "image", onRemove, className = "" }) {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  let hideTimer = null;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  };

  const handleProgressClick = (e) => {
    const bar = progressRef.current;
    const video = videoRef.current;
    if (!bar || !video) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    video.currentTime = ratio * video.duration;
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) video.requestFullscreen();
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => setShowControls(false), 2500);
  };

  useEffect(() => {
    return () => clearTimeout(hideTimer);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (mediaType !== "video") {
    return (
      <div className={`relative w-full rounded-2xl overflow-hidden bg-[#0c1017] border border-gray-800 shadow-2xl ${className}`}>
        <img
          src={src}
          alt="Preview"
          className="w-full max-h-[340px] object-contain"
        />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg"
            title="Remove"
          >
            <FiX size={16} />
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-70" />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-2xl group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full max-h-[340px] object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20"
        >
          <div className="bg-white/20 backdrop-blur-md rounded-full p-4 border border-white/30 shadow-2xl hover:bg-white/30 transition-all duration-200">
            <FiPlay size={28} className="text-white ml-1" />
          </div>
        </div>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg z-20"
          title="Remove"
        >
          <FiX size={16} />
        </button>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-3 relative overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="text-white hover:text-blue-300 transition-colors cursor-pointer"
            >
              {isPlaying ? <FiPause size={18} /> : <FiPlay size={18} />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="text-white hover:text-blue-300 transition-colors cursor-pointer"
            >
              {isMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
            </button>

            <span className="text-white/70 text-[11px] font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFullscreen}
            className="text-white hover:text-blue-300 transition-colors cursor-pointer"
          >
            <FiMaximize size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;