import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import dp from "../assets/dp.png";
import { FiX, FiSearch, FiSend, FiLink } from "react-icons/fi";
import { setSelectedUser } from "../redux/message.Slice";
import { ClipLoader } from "react-spinners";

function ReelShareModal({ reel, onClose }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userData } = useSelector((state) => state.user);

  const [search, setSearch] = useState("");
  const [sentTo, setSentTo] = useState(new Set());
  const [sending, setSending] = useState({}); 
  const [linkCopied, setLinkCopied] = useState(false);

  const inputRef = useRef(null);
  const drawerRef = useRef(null);

  const followingList = userData?.following || [];

  const filtered = followingList.filter((u) => {
    const name = (u.username || u.userName || u.name || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [onClose]);

  const handleSendToUser = async (user) => {
    const userId = (user._id || user.id)?.toString();
    if (!userId || sentTo.has(userId) || sending[userId]) return;

    setSending((prev) => ({ ...prev, [userId]: true }));

    try {
      const reelCard = JSON.stringify({
        type: "reel_share",
        reelId: reel._id,
        media: reel.media,
        mediaType: reel.mediaType || "video",
        authorUsername: reel.author?.username || reel.author?.userName || "user",
        authorImage: reel.author?.profileImage || "",
      });

      const formData = new FormData();
      formData.append("message", reelCard);

      await axios.post(
        `${serverUrl}/api/messages/send/${userId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      setSentTo((prev) => new Set([...prev, userId]));
    } catch (error) {
      console.error("Error sending reel share:", error);
    } finally {
      setSending((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleOpenDm = (user) => {
    dispatch(setSelectedUser(user));
    onClose();
    navigate("/messageArea");
  };

  const handleCopyLink = () => {
    const shareUrl = reel?.media || `${window.location.origin}/reels?reelId=${reel._id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
      <div
        ref={drawerRef}
        className="w-full bg-[#1a1a1a] rounded-t-3xl border-t border-gray-800 pb-6 flex flex-col max-h-[70%] animate-in slide-in-from-bottom duration-300 shadow-2xl"
      >
        {/* Pull Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            onClick={onClose}
            className="w-10 h-1 bg-gray-600 hover:bg-gray-500 rounded-full cursor-pointer transition"
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800/80">
          <h3 className="text-sm font-bold text-white tracking-wide">Share Reel</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 cursor-pointer transition rounded-full hover:bg-gray-800"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Copy Link Button */}
        <div className="px-5 pt-4 pb-2">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-900 border border-gray-800 hover:bg-gray-800 transition cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 flex-shrink-0 group-hover:border-gray-600 transition">
              <FiLink size={18} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white">
              {linkCopied ? "✅ Link Copied!" : "Copy Link"}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-5 py-2">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5">
            <FiSearch size={16} className="text-gray-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search following..."
              className="flex-1 text-sm bg-transparent text-white placeholder-gray-500 outline-none"
            />
          </div>
        </div>

        {/* Following Users List */}
        <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-2 no-scrollbar">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm font-semibold text-gray-400">
                {followingList.length === 0 ? "Follow users to share reels" : "No users found"}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {followingList.length === 0
                  ? "Explore Vistagram to find people to follow!"
                  : "Try a different name"}
              </p>
            </div>
          ) : (
            filtered.map((user, idx) => {
              const userId = (user._id || user.id)?.toString();
              const username = user.username || user.userName || "User";
              const name = user.name || "";
              const isSent = sentTo.has(userId);
              const isLoading = sending[userId];

              return (
                <div
                  key={userId || idx}
                  className="w-full flex items-center justify-between py-2"
                >
                  <div
                    onClick={() => handleOpenDm(user)}
                    className="flex items-center gap-3 overflow-hidden cursor-pointer group flex-1"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-gray-700 bg-gray-900 flex-shrink-0 group-hover:scale-105 transition">
                      <img
                        src={user.profileImage || dp}
                        alt={username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="text-sm font-bold text-white truncate group-hover:underline">
                        {username}
                      </span>
                      {name && (
                        <span className="text-xs text-gray-400 truncate">{name}</span>
                      )}
                    </div>
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={() => handleSendToUser(user)}
                    disabled={isSent || isLoading}
                    className={`ml-3 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex-shrink-0 ${
                      isSent
                        ? "bg-gray-800 text-gray-400 cursor-default"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30"
                    }`}
                  >
                    {isLoading ? (
                      <ClipLoader size={12} color="#ffffff" />
                    ) : isSent ? (
                      "Sent ✓"
                    ) : (
                      <>
                        <FiSend size={11} />
                        Send
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ReelShareModal;
