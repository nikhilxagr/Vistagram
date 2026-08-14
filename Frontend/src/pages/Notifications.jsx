import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import dp from "../assets/dp.png";
import { FiArrowLeft, FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa6";
import { FiMessageCircle, FiUserPlus } from "react-icons/fi";
import {
  markNotificationRead,
  markAllRead,
} from "../redux/notification.Slice";

// Type icon map
const typeIcon = {
  like: <FaHeart className="text-red-500" size={13} />,
  comment: <FiMessageCircle className="text-blue-400" size={13} />,
  follow: <FiUserPlus className="text-green-400" size={13} />,
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

function groupNotifications(notifications) {
  const now = Date.now();
  const ONE_DAY = 86400000;
  const ONE_WEEK = 7 * ONE_DAY;

  const groups = { Today: [], "This Week": [], Earlier: [] };
  notifications.forEach((n) => {
    const diff = now - new Date(n.createdAt).getTime();
    if (diff < ONE_DAY) groups["Today"].push(n);
    else if (diff < ONE_WEEK) groups["This Week"].push(n);
    else groups["Earlier"].push(n);
  });

  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

function Notifications() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector(
    (state) => state.notification
  );

  const groups = groupNotifications(notifications);

  const handleMarkRead = useCallback(
    async (notification) => {
      if (notification.isRead) return;
      try {
        await axios.put(
          `${serverUrl}/api/users/notifications/${notification._id}/markAsRead`,
          {},
          { withCredentials: true }
        );
        dispatch(markNotificationRead(notification._id));
      } catch {
        // silent
      }
    },
    [dispatch]
  );

  const handleMarkAllRead = async () => {
    try {
      await axios.put(
        `${serverUrl}/api/users/notifications/markAllRead`,
        {},
        { withCredentials: true }
      );
      dispatch(markAllRead());
    } catch {
    }
  };

  const handleAvatarClick = (e, n) => {
    e.stopPropagation();
    handleMarkRead(n);
    const username = n.sender?.username || n.sender?.userName;
    if (username) navigate(`/profile/${username}`);
  };

  const handlePostClick = (e, n) => {
    e.stopPropagation();
    handleMarkRead(n);
    const postId = n.post?._id || n.post;
    if (postId) navigate(`/post/${postId}`);
  };

  const handleRowClick = (n) => {
    handleMarkRead(n);

    if (n.type === "follow") {
      const username = n.sender?.username || n.sender?.userName;
      if (username) navigate(`/profile/${username}`);
    }
    // For like/comment, whole row click (not thumbnail) is passive — just marks read
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col">
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-gray-900">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-900 transition cursor-pointer -ml-2"
            >
              <FiArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer px-1"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center px-8">
            <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-5">
              <FiHeart size={34} className="text-gray-600" />
            </div>
            <h2 className="text-base font-bold text-white mb-2">
              Activity on your posts
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              When someone likes or comments on one of your posts or starts following you, you'll see it here.
            </p>
          </div>
        ) : (
          groups.map(([label, items]) => (
            <div key={label}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-5 pt-5 pb-2">
                {label}
              </p>

              {items.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleRowClick(n)}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition active:opacity-70 ${
                    !n.isRead
                      ? "bg-blue-950/20 hover:bg-blue-950/30"
                      : "hover:bg-gray-900/40"
                  }`}
                >
                  {/* Avatar — click goes to sender's profile */}
                  <div
                    className="relative flex-shrink-0"
                    onClick={(e) => handleAvatarClick(e, n)}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-700 bg-gray-900 hover:opacity-80 transition">
                      <img
                        src={n.sender?.profileImage || dp}
                        alt={n.sender?.username || "User"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                      {typeIcon[n.type] || (
                        <FiHeart size={10} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 leading-snug">
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
                    <p className="text-xs text-gray-500 mt-0.5">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {n.post?.media && (
                    <div
                      onClick={(e) => handlePostClick(e, n)}
                      className="w-12 h-12 rounded-xl overflow-hidden border border-gray-800 flex-shrink-0 bg-black hover:opacity-80 hover:border-gray-600 transition cursor-pointer"
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

                  {/* Unread Blue Dot */}
                  {!n.isRead && (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;
