import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { serverUrl } from "../App.jsx";
import { FiSearch, FiX, FiPlay, FiPause, FiMusic, FiCheck } from "react-icons/fi";
import { ClipLoader } from "react-spinners";

const DEFAULT_CATEGORIES = [
  { label: "Trending", query: "trending hindi bollywood pop" },
  { label: "Bollywood", query: "arijit singh shreya ghoshal bollywood" },
  { label: "Pop Hits", query: "the weeknd dua lipa pop" },
  { label: "Romantic", query: "romantic love songs" },
  { label: "Punjabi", query: "punjabi hits ap dhillon sidhu" },
  { label: "Lofi Vibes", query: "lofi chill beats" },
];

function StoryMusicPicker({ isOpen, onClose, onSelectSong, selectedSong }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Trending");
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewingSongId, setPreviewingSongId] = useState(null);

  const audioRef = useRef(new Audio());
  const searchTimeoutRef = useRef(null);

  // Stop audio on unmount or close
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      audioRef.current.pause();
      setPreviewingSongId(null);
    }
  }, [isOpen]);

  // Fetch songs via Backend Proxy
  const fetchSongs = async (term) => {
    if (!term || !term.trim()) return;
    setIsLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/story/music/search`, {
        params: { query: term.trim() },
        withCredentials: true,
      });

      if (res.data?.results) {
        setSongs(res.data.results);
      } else {
        setSongs([]);
      }
    } catch (err) {
      console.error("Error fetching music from backend proxy:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load default category
  useEffect(() => {
    if (isOpen && !searchQuery.trim()) {
      const cat = DEFAULT_CATEGORIES.find((c) => c.label === activeCategory);
      fetchSongs(cat ? cat.query : "bollywood trending hits");
    }
  }, [isOpen, activeCategory]);

  // Handle Search Input with debounce
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchSongs(val);
      }, 400);
    } else {
      const cat = DEFAULT_CATEGORIES.find((c) => c.label === activeCategory);
      fetchSongs(cat ? cat.query : "bollywood trending hits");
    }
  };

  // Toggle 30s Audio Preview
  const handleTogglePreview = (e, song) => {
    e.stopPropagation();
    const audio = audioRef.current;

    if (previewingSongId === song.id) {
      audio.pause();
      setPreviewingSongId(null);
    } else {
      audio.pause();
      audio.src = song.audioUrl;
      audio.play().catch((err) => console.log("Audio play blocked:", err));
      setPreviewingSongId(song.id);

      audio.onended = () => {
        setPreviewingSongId(null);
      };
    }
  };

  // Select Song
  const handleSelect = (song) => {
    audioRef.current.pause();
    setPreviewingSongId(null);
    onSelectSong(song);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[320] bg-black/75 backdrop-blur-sm flex flex-col justify-end transition-opacity duration-200 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto bg-[#141414] text-white rounded-t-[28px] border-t border-gray-800 shadow-2xl flex flex-col h-[80vh] max-h-[660px] animate-in slide-in-from-bottom duration-300 ease-out overflow-hidden"
      >
        {/* Drag pill */}
        <div
          onClick={onClose}
          className="w-full pt-3 pb-1 flex items-center justify-center cursor-pointer group"
        >
          <div className="w-10 h-1 bg-gray-600 rounded-full group-hover:bg-gray-400 transition" />
        </div>

        {/* Top Header */}
        <div className="px-5 py-2 flex items-center justify-between border-b border-gray-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-500 flex items-center justify-center text-white text-xs">
              <FiMusic size={14} />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">Add Music to Story</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 pb-2">
          <div className="relative flex items-center bg-[#202020] border border-gray-800 rounded-full px-3.5 py-2">
            <FiSearch size={16} className="text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search songs, artists, Bollywood, Pop..."
              className="bg-transparent text-xs text-white placeholder-gray-500 outline-none w-full"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  const cat = DEFAULT_CATEGORIES.find((c) => c.label === activeCategory);
                  fetchSongs(cat ? cat.query : "bollywood trending hits");
                }}
                className="text-gray-400 hover:text-white text-xs p-1"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Chips */}
        {!searchQuery && (
          <div className="px-4 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-gray-800/60">
            {DEFAULT_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.label);
                    fetchSongs(cat.query);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? "bg-white text-black shadow"
                      : "bg-gray-800/80 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Song List Stream */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 no-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
              <ClipLoader size={24} color="#ec4899" />
              <span className="text-xs">Finding songs...</span>
            </div>
          ) : songs.length > 0 ? (
            songs.map((song) => {
              const isSelected = selectedSong?.id === song.id;
              const isPlaying = previewingSongId === song.id;

              return (
                <div
                  key={song.id}
                  onClick={() => handleSelect(song)}
                  className={`group flex items-center justify-between gap-3 p-2 rounded-2xl transition cursor-pointer ${
                    isSelected
                      ? "bg-pink-500/10 border border-pink-500/30"
                      : "hover:bg-gray-800/50"
                  }`}
                >
                  {/* Album art with Play button overlay */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 shadow-md">
                    <img
                      src={song.coverImage}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={(e) => handleTogglePreview(e, song)}
                      className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition cursor-pointer"
                      title={isPlaying ? "Pause Preview" : "Play Preview"}
                    >
                      {isPlaying ? (
                        <div className="flex items-center gap-0.5">
                          <span className="w-1 h-3 bg-pink-400 animate-pulse rounded-full" />
                          <span className="w-1 h-4 bg-pink-400 animate-pulse delay-75 rounded-full" />
                          <span className="w-1 h-2 bg-pink-400 animate-pulse delay-150 rounded-full" />
                        </div>
                      ) : (
                        <FiPlay size={16} className="ml-0.5 fill-white text-white" />
                      )}
                    </button>
                  </div>

                  {/* Title & Artist */}
                  <div className="flex flex-col flex-1 min-w-0 text-left">
                    <span className="font-bold text-white text-xs truncate group-hover:text-pink-400 transition">
                      {song.title}
                    </span>
                    <span className="text-gray-400 text-[11px] truncate mt-0.5">
                      {song.artist}
                    </span>
                  </div>

                  {/* Select button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(song);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-pink-500 text-white shadow-lg"
                        : "bg-gray-800 text-gray-200 hover:bg-white hover:text-black"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <FiCheck size={12} />
                        <span>Added</span>
                      </>
                    ) : (
                      <span>Add</span>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-center text-gray-500">
              <span className="text-3xl">🎵</span>
              <p className="text-sm font-bold text-gray-300">No songs found</p>
              <p className="text-xs text-gray-500">Try searching for a different song or artist.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StoryMusicPicker;
