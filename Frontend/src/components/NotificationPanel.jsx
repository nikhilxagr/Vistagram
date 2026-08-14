import React, { useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import dp from "../assets/dp.png";
import { FiHeart, FiMessageCircle, FiUserPlus, FiX } from "react-icons/fi";
import { FaHeart } from "react-icons/fa6";
import { markNotificationRead, markAllRead } from "../redux/notification.Slice";

// Icon per notification type
const typeIcon = {
  like: <FaHeart className="text-red-500" size={14} />,
  comment: <FiMessageCircle className="text-blue-400" size={14} />,
  follow: <FiUserPlus className="text-green-400" size={14} />,
};

function timeAgo(date) {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function NotificationPanel({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const { notifications, unreadCount } = useSelector((state) => state.notification);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const handleMarkRead = async (notification) => {
    if (notification.isRead) return;
    try {
      await axios.put(
        `${serverUrl}/api/users/notifications/${notification._id}/markAsRead`,
        {},
        { withCredentials: true }
      );
      dispatch(markNotificationRead(notification._id));
    } catch (e) {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(
        `${serverUrl}/api/users/notifications/markAllRead`,
        {},
        { withCredentials: true }
      );
      dispatch(markAllRead());
    } catch (e) {
    }
  };

  const handleAvatarClick = (e, n) => {
    e.stopPropagation();
    handleMarkRead(n);
    const username = n.sender?.username || n.sender?.userName;
    if (username) { navigate(`/profile/${username}`); onClose(); }
  };

  const handlePostClick = (e, n) => {
    e.stopPropagation();
    handleMarkRead(n);
    const postId = n.post?._id || n.post;
    if (postId) { navigate(`/post/${postId}`); onClose(); }
  };

  const handleRowClick = (n) => {
    handleMarkRead(n);
    if (n.type === "follow") {
      const username = n.sender?.username || n.sender?.userName;
      if (username) { navigate(`/profile/${username}`); onClose(); }
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute left-full ml-3 top-0 w-[340px] max-h-[520px] bg-[#1a1a1a] border border-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-left duration-200"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition cursor-pointer p-1 rounded-full hover:bg-gray-800"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>

        {/* Notification List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-3">
              <FiHeart size={22} className="text-gray-600" />
            </div>
            <p className="text-sm font-semibold text-gray-400">No notifications yet</p>
            <p className="text-xs text-gray-600 mt-1">
              When someone likes or comments on your posts, you'll see it here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleRowClick(n)}
              className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition group ${
                !n.isRead
                  ? "bg-blue-950/20 hover:bg-blue-950/30"
                  : "hover:bg-gray-900/60"
              }`}
            >

              <div
                className="relative flex-shrink-0"
                onClick={(e) => handleAvatarClick(e, n)}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-700 bg-gray-900 hover:opacity-80 transition">
                  <img
                    src={n.sender?.profileImage || dp}
                    alt={n.sender?.username || "User"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                  {typeIcon[n.type] || <FiHeart size={10} className="text-gray-400" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-200 leading-snug">
                  <span
                    className="font-bold text-white hover:underline cursor-pointer"
                    onClick={(e) => handleAvatarClick(e, n)}
                  >
                    {n.sender?.username || n.sender?.name || "Someone"}
                  </span>{" "}
                  {n.type === "like"
                    ? "liked your post."
                    : n.type === "comment"
                    ? "commented on your post."
                    : "started following you."}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
              </div>

              {n.post?.media && (
                <div
                  onClick={(e) => handlePostClick(e, n)}
                  className="w-10 h-10 rounded-lg overflow-hidden border border-gray-800 flex-shrink-0 bg-black hover:opacity-80 hover:border-gray-600 transition cursor-pointer"
                >
                  {n.post.mediaType === "video" ? (
                    <video
                      src={n.post.media}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={n.post.media}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}

              {/* Unread dot */}
              {!n.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationPanel;
