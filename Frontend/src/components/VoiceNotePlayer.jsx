import React, { useState, useRef, useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

// Format seconds into m:ss
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Generate stylized waveform bar heights (normalized 0 - 100%)
const DEFAULT_WAVE_BARS = [
  30, 55, 40, 80, 60, 95, 70, 45, 85, 100,
  65, 40, 75, 90, 50, 85, 65, 45, 95, 70,
  55, 80, 45, 60, 35, 70, 50, 30
];

function VoiceNotePlayer({ audioUrl, duration = 0, isSender = false }) {
  const audioRef = useRef(null);
  const waveformRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Synchronize initial duration prop
  useEffect(() => {
    if (duration > 0 && !totalDuration) {
      setTotalDuration(duration);
    }
  }, [duration, totalDuration]);

  // Audio lifecycle & listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setTotalDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity && !totalDuration) {
        setTotalDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);

    // Global listener so only one voice note plays at any time
    const handleGlobalPlay = (e) => {
      if (e.detail?.audio !== audio && !audio.paused) {
        audio.pause();
      }
    };
    window.addEventListener("vistagram-play-audio", handleGlobalPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      window.removeEventListener("vistagram-play-audio", handleGlobalPlay);
    };
  }, [totalDuration]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      window.dispatchEvent(
        new CustomEvent("vistagram-play-audio", { detail: { audio } })
      );
      audio.play().catch((err) => {
        console.error("Audio playback error:", err);
      });
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const waveEl = waveformRef.current;
    if (!audio || !waveEl) return;

    const rect = waveEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetDuration = totalDuration || audio.duration || 0;

    if (targetDuration > 0) {
      const newTime = pct * targetDuration;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const cycleSpeed = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    const speeds = [1, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audio) {
      audio.playbackRate = nextSpeed;
    }
  };

  const progressPct = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex flex-col gap-1.5 w-[240px] sm:w-[270px] select-none py-1">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Main Bar Controls */}
      <div className="flex items-center gap-2.5">
        {/* Play / Pause Circular Button */}
        <button
          type="button"
          onClick={togglePlayPause}
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-md cursor-pointer ${
            isSender
              ? "bg-white text-blue-600 hover:bg-gray-100"
              : "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
          }`}
          aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
        >
          {isPlaying ? (
            <FaPause size={12} />
          ) : (
            <FaPlay size={12} className="ml-0.5" />
          )}
        </button>

        {/* Waveform Visualization & Seek Bar */}
        <div
          ref={waveformRef}
          onClick={handleSeek}
          className="flex-1 h-8 flex items-center gap-[2.5px] cursor-pointer group py-1 relative"
          title="Click to seek"
        >
          {DEFAULT_WAVE_BARS.map((heightPct, idx) => {
            const barPct = (idx / (DEFAULT_WAVE_BARS.length - 1)) * 100;
            const isPlayed = barPct <= progressPct;

            return (
              <div
                key={idx}
                className="flex-1 flex items-center justify-center h-full"
              >
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-[2.5px] rounded-full transition-all duration-100 group-hover:scale-y-110 ${
                    isPlayed
                      ? isSender
                        ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                        : "bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.7)]"
                      : isSender
                      ? "bg-white/35"
                      : "bg-gray-600"
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Speed Multiplier Button */}
        <button
          type="button"
          onClick={cycleSpeed}
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors cursor-pointer flex-shrink-0 ${
            isSender
              ? "bg-white/20 text-white hover:bg-white/30"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
          title="Change playback speed"
        >
          {playbackSpeed}x
        </button>
      </div>

      {/* Timer Display */}
      <div className="flex items-center justify-between px-1 text-[10px] font-medium opacity-85">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(totalDuration || currentTime)}</span>
      </div>
    </div>
  );
}

export default VoiceNotePlayer;
