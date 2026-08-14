import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiPlusSquare, FiImage, FiFilm, FiClock, FiMusic, FiTrash2 } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import axios from "axios";
import { serverUrl } from "../App.jsx";
import Nav from "../components/Nav";
import VideoPlayer from "../components/VideoPlayer";
import StoryMusicPicker from "../components/StoryMusicPicker";
import { addPost, setPostLoading, setPostError } from "../redux/post.Slice";
import { addReel, setReelLoading, setReelError } from "../redux/reel.Slice";
import { addStory, setStoryLoading, setStoryError } from "../redux/story.slice";

function Upload() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { userData } = useSelector((state) => state.user);
  const { posts, loading: postLoading } = useSelector((state) => state.post);
  const { reels, loading: reelLoading } = useSelector((state) => state.reel);
  const { stories, loading: storyLoading } = useSelector((state) => state.story);

  const initialTab = location.state?.tab || "Post";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [caption, setCaption] = useState("");
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (activeTab === "Reel" && !file.type.startsWith("video")) {
        setMessage({
          text: "Reels can only be video files! Please select a video.",
          type: "error",
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (file.type.startsWith("video")) {
        setMediaType("video");
      } else {
        setMediaType("image");
      }
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedMusic(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage({ text: "Please select a media file to upload", type: "error" });
      return;
    }

    if (activeTab === "Reel" && mediaType !== "video") {
      setMessage({
        text: "Reels can only be video files! Please select a video.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    if (activeTab === "Post") dispatch(setPostLoading(true));
    else if (activeTab === "Reel") dispatch(setReelLoading(true));
    else if (activeTab === "Story") dispatch(setStoryLoading(true));

    try {
      const formData = new FormData();
      formData.append("media", selectedFile);
      formData.append("caption", caption);
      formData.append("mediaType", mediaType);

      if (selectedMusic) {
        formData.append("music", JSON.stringify(selectedMusic));
      }

      let endpoint = `${serverUrl}/api/posts/upload`;
      if (activeTab === "Story") {
        endpoint = `${serverUrl}/api/story/upload`;
      } else if (activeTab === "Reel") {
        endpoint = `${serverUrl}/api/reels/upload`;
      }

      const response = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      const uploadedItem = response.data?.post || response.data?.reel || response.data?.story || response.data;

      if (activeTab === "Post") {
        dispatch(addPost(uploadedItem));
      } else if (activeTab === "Reel") {
        dispatch(addReel(uploadedItem));
      } else if (activeTab === "Story") {
        dispatch(addStory(uploadedItem));
      }

      setMessage({
        text: response.data.message || `${activeTab} uploaded successfully!`,
        type: "success",
      });

      setTimeout(() => {
        if (activeTab === "Reel") {
          navigate("/reels");
        } else if (activeTab === "Story") {
          navigate("/story");
        } else {
          navigate("/");
        }
      }, 1200);
    } catch (err) {
      console.error("Upload error:", err);
      const errMsg = err.response?.data?.message || `Failed to upload ${activeTab.toLowerCase()}`;

      if (activeTab === "Post") dispatch(setPostError(errMsg));
      else if (activeTab === "Reel") dispatch(setReelError(errMsg));
      else if (activeTab === "Story") dispatch(setStoryError(errMsg));

      setMessage({ text: errMsg, type: "error" });
    } finally {
      setLoading(false);
      if (activeTab === "Post") dispatch(setPostLoading(false));
      else if (activeTab === "Reel") dispatch(setReelLoading(false));
      else if (activeTab === "Story") dispatch(setStoryLoading(false));
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col items-center relative pb-28 select-none">
      {/* Sticky Header */}
      <header className="w-full max-w-2xl flex items-center justify-between px-6 py-4 border-b border-gray-900 sticky top-0 bg-black/95 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-white text-xl hover:opacity-80 transition cursor-pointer p-1"
            aria-label="Go Back"
          >
            <FiArrowLeft />
          </button>
          <h1 className="text-base md:text-lg font-bold text-white tracking-wide">
            Create New
          </h1>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
          <span>{posts?.length || 0} Posts</span>
          <span>·</span>
          <span>{stories?.length || 0} Stories</span>
          <span>·</span>
          <span>{reels?.length || 0} Reels</span>
        </div>
      </header>

      <main className="w-full max-w-lg px-5 pt-6 flex flex-col items-center">
        {/* Create Mode Tab Switcher */}
        <div className="bg-gray-900 border border-gray-800 text-white rounded-full p-1.5 w-full max-w-md flex items-center justify-between shadow-2xl mb-6">
          {[
            { name: "Post", icon: FiImage },
            { name: "Story", icon: FiClock },
            { name: "Reel", icon: FiFilm },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => {
                  setActiveTab(tab.name);
                  handleClearFile();
                  setMessage({ text: "", type: "" });
                }}
                className={`flex-1 flex items-center justify-center gap-2 font-bold text-xs py-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-white text-black shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                }`}
              >
                <Icon size={15} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Description Context Banner */}
        <p className="text-xs text-gray-400 text-center mb-6 font-medium">
          {activeTab === "Post" && "Share photos or videos to your feed"}
          {activeTab === "Story" && "Share a 24-hour photo or video story"}
          {activeTab === "Reel" && "Share short videos to the Reels feed"}
        </p>

        {message.text && (
          <div
            className={`w-full mb-6 py-2.5 px-4 rounded-xl text-center text-xs font-semibold border ${
              message.type === "success"
                ? "bg-green-500/10 text-green-400 border-green-500/30"
                : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}
          >
            {message.text}
          </div>
        )}

        {!previewUrl ? (
          <label
            htmlFor="mediaFileInput"
            className="bg-gray-950 border border-gray-800 rounded-3xl w-full max-w-md h-[240px] md:h-[260px] flex flex-col items-center justify-center cursor-pointer hover:border-gray-700 hover:bg-gray-900/60 transition-all shadow-2xl p-6 group relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4 text-gray-300 group-hover:scale-110 transition-transform">
              <FiPlusSquare className="text-2xl" />
            </div>
            <span className="text-sm font-bold text-white mb-1">
              Select {activeTab} File
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {activeTab === "Reel" ? "Supports MP4, MOV videos" : "Supports Photos & Videos"}
            </span>
            <input
              type="file"
              id="mediaFileInput"
              accept={activeTab === "Reel" ? "video/*" : "image/*,video/*"}
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <div className="w-full max-w-md flex flex-col items-center gap-4">
            <VideoPlayer
              src={previewUrl}
              mediaType={mediaType}
              onRemove={handleClearFile}
            />

            <div className="w-full flex flex-col gap-2">
              {!selectedMusic ? (
                <button
                  type="button"
                  onClick={() => setShowMusicPicker(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-gray-900 border border-gray-800 hover:border-pink-500/50 hover:bg-gray-850 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <FiMusic className="text-pink-400" size={16} />
                  <span>Add Music to {activeTab} (iTunes)</span>
                </button>
              ) : (
                <div className="w-full bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-pink-500/30 rounded-2xl p-3 flex items-center justify-between shadow-lg animate-in fade-in duration-200">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 shadow">
                      <img
                        src={selectedMusic.coverImage}
                        alt={selectedMusic.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col text-left min-w-0 flex-1">
                      <span className="text-xs font-bold text-white truncate">
                        {selectedMusic.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 truncate">
                          {selectedMusic.artist}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <span className="w-0.5 h-2 bg-pink-400 animate-pulse rounded-full" />
                          <span className="w-0.5 h-3 bg-pink-400 animate-pulse delay-75 rounded-full" />
                          <span className="w-0.5 h-1.5 bg-pink-400 animate-pulse delay-150 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMusicPicker(true)}
                      className="text-xs font-bold text-pink-400 hover:underline px-2 cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMusic(null)}
                      className="p-1.5 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-800 transition cursor-pointer"
                      title="Remove song"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {activeTab !== "Story" && (
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={`Write a caption for your ${activeTab.toLowerCase()}...`}
                  rows={3}
                  className="w-full rounded-2xl bg-gray-950 border border-gray-800 p-3.5 text-white text-sm outline-none focus:border-gray-700 transition resize-none placeholder-gray-500"
                />
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading || postLoading || reelLoading || storyLoading}
              className="w-full h-12 rounded-2xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition shadow-lg flex items-center justify-center cursor-pointer disabled:opacity-60 mt-2"
            >
              {loading ? (
                <ClipLoader size={20} color="#000000" />
              ) : (
                `Share ${activeTab}`
              )}
            </button>
          </div>
        )}
      </main>
      <Nav />

      {/* Music Picker Modal */}
      <StoryMusicPicker
        isOpen={showMusicPicker}
        onClose={() => setShowMusicPicker(false)}
        onSelectSong={(song) => setSelectedMusic(song)}
        selectedSong={selectedMusic}
      />
    </div>
  );
}

export default Upload;