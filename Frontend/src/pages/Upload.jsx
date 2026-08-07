import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiPlusSquare } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import axios from "axios";
import { serverUrl } from "../App.jsx";
import Nav from "../components/Nav";
import VideoPlayer from "../components/VideoPlayer";
import { addPost, setPostLoading, setPostError } from "../redux/post.Slice";
import { addReel, setReelLoading, setReelError } from "../redux/reel.Slice";
import { addStory, setStoryLoading, setStoryError } from "../redux/story.slice";

function Upload() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userData } = useSelector((state) => state.user);
  const { posts, loading: postLoading } = useSelector((state) => state.post);
  const { reels, loading: reelLoading } = useSelector((state) => state.reel);
  const { stories, loading: storyLoading } = useSelector((state) => state.story);

  const [activeTab, setActiveTab] = useState("Post");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
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

      let endpoint = `${serverUrl}/api/posts/upload`;
      if (activeTab === "Story") {
        endpoint = `${serverUrl}/api/stories/upload`;
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
    <div className="w-full min-h-screen bg-black text-white flex flex-col items-center relative pb-28">
      <header className="w-full max-w-2xl flex items-center justify-between px-6 py-4 border-b border-gray-900 sticky top-0 bg-black/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-white text-xl hover:opacity-80 transition cursor-pointer p-1"
            aria-label="Go Back"
          >
            <FiArrowLeft />
          </button>
          <h1 className="text-base md:text-lg font-bold text-white tracking-wide">
            Upload Media
          </h1>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
          <span>{posts?.length || 0} posts</span>
          <span>·</span>
          <span>{reels?.length || 0} reels</span>
          <span>·</span>
          <span>{stories?.length || 0} stories</span>
        </div>
      </header>

      <main className="w-full max-w-lg px-6 pt-6 flex flex-col items-center">
        <div className="bg-white text-black rounded-full p-1.5 w-full max-w-sm flex items-center justify-between shadow-2xl mb-8">
          {["Post", "Story", "Reel"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                handleClearFile();
                setMessage({ text: "", type: "" });
              }}
              className={`flex-1 text-center font-bold text-sm py-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === tab
                  ? "bg-black text-white shadow-lg"
                  : "text-black hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

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
            className="bg-[#0c1017] border border-gray-800 rounded-2xl w-full max-w-md h-[220px] md:h-[240px] flex flex-col items-center justify-center cursor-pointer hover:border-gray-700 hover:bg-[#101520] transition-all shadow-2xl p-6 group"
          >
            <FiPlusSquare className="text-white text-3xl mb-3 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-gray-200">
              Upload {activeTab.toLowerCase()} {activeTab === "Reel" && "(Video Only)"}
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

            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={`Write a caption for your ${activeTab.toLowerCase()}...`}
                rows={3}
                className="w-full rounded-xl bg-gray-900 border border-gray-800 p-3.5 text-white text-sm outline-none focus:border-gray-700 transition resize-none"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={loading || postLoading || reelLoading || storyLoading}
              className="w-full h-12 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition shadow-lg flex items-center justify-center cursor-pointer disabled:opacity-60 mt-2"
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
    </div>
  );
}

export default Upload;