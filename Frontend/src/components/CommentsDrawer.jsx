import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App.jsx";
import dp from "../assets/dp.png";
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import { FiX, FiTrash2, FiArrowUp } from "react-icons/fi";
import { ClipLoader } from "react-spinners";

function formatTimeAgo(dateInput) {
  if (!dateInput) return "Just now";
  const now = new Date();
  const past = new Date(dateInput);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 52) return `${diffInWeeks}w`;
  return `${Math.floor(diffInWeeks / 52)}y`;
}

const QUICK_EMOJIS = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];

function CommentsDrawer({
  isOpen,
  onClose,
  postId,
  postAuthorId,
  comments = [],
  onCommentsUpdate,
  currentUserId,
  currentUser,
}) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const pressTimerRef = useRef(null);
  const drawerRef = useRef(null);

  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState(comments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCommentToDelete, setSelectedCommentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setCommentsList(comments || []);
  }, [comments]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Long press handler for deletion
  const startPress = (c) => {
    const commentAuthorId = (c.author?._id || c.author || "").toString();
    const isCommentAuthor = currentUserId && commentAuthorId === currentUserId.toString();
    const isPostAuthor = currentUserId && postAuthorId === currentUserId.toString();

    if (!isCommentAuthor && !isPostAuthor) return;

    pressTimerRef.current = setTimeout(() => {
      setSelectedCommentToDelete(c);
    }, 500);
  };

  const cancelPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    if (!commentInput.trim() || isSubmitting || !postId) return;

    const newMsg = commentInput.trim();
    setIsSubmitting(true);
    setCommentInput("");

    const tempComment = {
      _id: "temp-" + Date.now(),
      message: newMsg,
      createdAt: new Date().toISOString(),
      likes: [],
      author: {
        _id: currentUserId,
        name: currentUser?.name || "You",
        username: currentUser?.username || currentUser?.userName || "you",
        profileImage: currentUser?.profileImage || dp,
      },
    };

    const nextList = [...commentsList, tempComment];
    setCommentsList(nextList);

    try {
      const res = await axios.post(
        `${serverUrl}/api/posts/${postId}/comment`,
        { message: newMsg },
        { withCredentials: true }
      );

      if (res.data?.comments) {
        setCommentsList(res.data.comments);
        if (onCommentsUpdate) onCommentsUpdate(res.data.comments);
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Emoji Tap
  const handleEmojiClick = (emoji) => {
    setCommentInput((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Reply to comment
  const handleReply = (username) => {
    setCommentInput((prev) => `@${username} ` + prev.replace(/^@\w+\s*/, ""));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Like Comment
  const handleLikeComment = async (commentId) => {
    if (!currentUserId || !postId || !commentId) return;

    const updated = commentsList.map((c) => {
      if ((c._id || c.id) === commentId) {
        const likes = Array.isArray(c.likes) ? [...c.likes] : [];
        const alreadyLiked = likes.some(
          (id) => (id._id || id || "").toString() === currentUserId.toString()
        );
        const nextLikes = alreadyLiked
          ? likes.filter((id) => (id._id || id || "").toString() !== currentUserId.toString())
          : [...likes, currentUserId];
        return { ...c, likes: nextLikes };
      }
      return c;
    });

    setCommentsList(updated);

    try {
      const res = await axios.put(
        `${serverUrl}/api/posts/${postId}/comment/${commentId}/like`,
        {},
        { withCredentials: true }
      );

      if (res.data?.comments) {
        setCommentsList(res.data.comments);
        if (onCommentsUpdate) onCommentsUpdate(res.data.comments);
      }
    } catch (err) {
      console.error("Error liking comment:", err);
    }
  };

  // Delete Comment
  const handleDeleteComment = async () => {
    if (!selectedCommentToDelete || !postId || isDeleting) return;
    const commentId = selectedCommentToDelete._id;
    setIsDeleting(true);

    try {
      const res = await axios.delete(
        `${serverUrl}/api/posts/${postId}/comment/${commentId}`,
        { withCredentials: true }
      );

      const nextList = commentsList.filter((c) => (c._id || c.id) !== commentId);
      setCommentsList(nextList);
      if (onCommentsUpdate) onCommentsUpdate(res.data?.comments || nextList);
      setSelectedCommentToDelete(null);
    } catch (err) {
      console.error("Error deleting comment:", err);
      const nextList = commentsList.filter((c) => (c._id || c.id) !== commentId);
      setCommentsList(nextList);
      if (onCommentsUpdate) onCommentsUpdate(nextList);
      setSelectedCommentToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex flex-col justify-end transition-opacity duration-300 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto bg-[#121212] text-white rounded-t-[28px] border-t border-gray-800/80 shadow-2xl flex flex-col h-[75vh] max-h-[620px] transition-transform transform translate-y-0 duration-300 ease-out animate-in slide-in-from-bottom relative overflow-hidden"
      >
        <div
          onClick={onClose}
          className="w-full pt-3 pb-1 flex items-center justify-center cursor-pointer group"
        >
          <div className="w-10 h-1 bg-gray-600 rounded-full group-hover:bg-gray-400 transition" />
        </div>

        <div className="px-5 py-2.5 flex items-center justify-between border-b border-gray-800/80">
          <span className="text-sm font-bold text-white tracking-wide">
            Comments
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition cursor-pointer"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar">
          {commentsList && commentsList.length > 0 ? (
            commentsList.map((c, idx) => {
              const commentUser =
                typeof c.author === "object" && c.author !== null ? c.author : {};
              const commentAuthorId = (c.author?._id || c.author || "").toString();
              const isCommentAuthor =
                currentUserId && commentAuthorId === currentUserId.toString();
              const isPostAuthor =
                currentUserId && postAuthorId && postAuthorId.toString() === currentUserId.toString();
              const isCommentPostAuthor =
                postAuthorId && commentAuthorId === postAuthorId.toString();
              const canDelete = isCommentAuthor || isPostAuthor;

              const cUsername =
                commentUser.username ||
                commentUser.userName ||
                commentUser.name ||
                (isCommentAuthor ? (currentUser?.username || currentUser?.userName) : "user");

              const cImage =
                commentUser.profileImage ||
                (isCommentAuthor ? currentUser?.profileImage : null) ||
                dp;

              const isCommentLiked =
                Array.isArray(c.likes) &&
                c.likes.some(
                  (id) => (id._id || id || "").toString() === (currentUserId || "").toString()
                );
              const commentLikesCount = Array.isArray(c.likes) ? c.likes.length : 0;
              const timeDisplay = formatTimeAgo(c.createdAt || c.date);

              return (
                <div
                  key={c._id || idx}
                  onTouchStart={() => startPress(c)}
                  onTouchEnd={cancelPress}
                  onMouseDown={() => startPress(c)}
                  onMouseUp={cancelPress}
                  onMouseLeave={cancelPress}
                  className="group/comment flex items-start justify-between gap-3 text-xs text-left p-1.5 rounded-2xl hover:bg-gray-800/40 transition select-none"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      onClick={() => navigate(`/profile/${cUsername}`)}
                      className="w-9 h-9 rounded-full overflow-hidden border border-gray-800 bg-gray-900 flex-shrink-0 cursor-pointer mt-0.5 hover:scale-105 transition"
                    >
                      <img
                        src={cImage}
                        alt={cUsername}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col text-left flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          onClick={() => navigate(`/profile/${cUsername}`)}
                          className="font-bold text-white cursor-pointer hover:underline text-[13px]"
                        >
                          {cUsername}
                        </span>
                        {isCommentPostAuthor && (
                          <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.2 rounded-md">
                            Author
                          </span>
                        )}
                        <span className="text-[11px] text-gray-500 font-medium">
                          {timeDisplay}
                        </span>
                      </div>

                      <p className="text-gray-200 mt-1 break-words text-[13px] leading-snug">
                        {c.message}
                      </p>

                      <div className="flex items-center gap-4 mt-2">
                        <button
                          type="button"
                          onClick={() => handleReply(cUsername)}
                          className="text-[11px] font-semibold text-gray-400 hover:text-white transition cursor-pointer"
                        >
                          Reply
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCommentToDelete(c);
                            }}
                            className="opacity-0 group-hover/comment:opacity-100 text-[11px] text-gray-500 hover:text-red-400 transition cursor-pointer flex items-center gap-1"
                          >
                            <FiTrash2 size={12} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Heart Like Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikeComment(c._id);
                    }}
                    className="flex flex-col items-center cursor-pointer text-gray-400 hover:text-red-500 transition p-1.5 pt-1"
                    title="Like comment"
                  >
                    {isCommentLiked ? (
                      <FaHeart className="text-red-500 text-sm animate-in zoom-in-50 duration-150" />
                    ) : (
                      <FaRegHeart className="text-gray-400 hover:text-white text-sm" />
                    )}
                    {commentLikesCount > 0 && (
                      <span className="text-[10px] text-gray-400 font-semibold leading-none mt-1">
                        {commentLikesCount}
                      </span>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center text-gray-500">
              <span className="text-3xl">💬</span>
              <p className="text-sm font-bold text-gray-300">No comments yet</p>
              <p className="text-xs text-gray-500">
                Be the first to share what you think!
              </p>
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-800/60 bg-[#141414] flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {QUICK_EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="text-xl p-1.5 hover:scale-125 transition-transform cursor-pointer rounded-full active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleAddComment}
          className="p-3.5 bg-[#121212] border-t border-gray-800/80 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 bg-gray-900 flex-shrink-0">
            <img
              src={currentUser?.profileImage || dp}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="What do you think of this?..."
              className="w-full bg-[#1e1e1e] border border-gray-800 text-white placeholder-gray-500 text-xs rounded-full pl-4 pr-10 py-2.5 outline-none focus:border-gray-600 transition"
            />

            <button
              type="submit"
              disabled={!commentInput.trim() || isSubmitting}
              className="absolute right-1.5 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 transition flex items-center justify-center text-white cursor-pointer"
              aria-label="Send comment"
            >
              {isSubmitting ? (
                <ClipLoader size={12} color="#ffffff" />
              ) : (
                <FiArrowUp size={15} className="stroke-[3]" />
              )}
            </button>
          </div>
        </form>
      </div>

      {selectedCommentToDelete && (
        <div
          className="fixed inset-0 z-[250] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedCommentToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-center animate-in zoom-in-95 duration-150"
          >
            <div className="p-5 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-1">
                <FiTrash2 size={20} />
              </div>
              <h3 className="text-sm font-bold text-white">Delete Comment?</h3>
              <p className="text-xs text-gray-400 leading-relaxed px-2">
                Are you sure you want to delete this comment? This action cannot be undone.
              </p>
            </div>

            <div className="flex flex-col border-t border-gray-900 divide-y divide-gray-900">
              <button
                type="button"
                onClick={handleDeleteComment}
                disabled={isDeleting}
                className="w-full py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeleting ? <ClipLoader size={14} color="#ef4444" /> : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedCommentToDelete(null)}
                className="w-full py-3 text-xs font-semibold text-gray-300 hover:bg-gray-900 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommentsDrawer;
