import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App.jsx";
import dp from "../assets/dp.png";
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaBookmark,
  FaRegBookmark,
} from "react-icons/fa6";
import {
  FiSend,
  FiMoreHorizontal,
  FiVolume2,
  FiVolumeX,
  FiPlay,
  FiPause,
  FiEdit2,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import { toggleLikePost, addCommentToPost, removePost, updatePost } from "../redux/post.Slice";
import { setUserData } from "../redux/userSlice";
import ReelShareModal from "./ReelShareModal";

function Post({ post }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userData } = useSelector((state) => state.user);
  const currentUserId = userData?._id || userData?.id;

  const checkIfSaved = () => {
    if (!userData?.savedPosts || !post?._id) return false;
    return userData.savedPosts.some(
      (sp) => (sp._id || sp || "").toString() === post._id.toString()
    );
  };

  const [isLiked, setIsLiked] = useState(
    post?.likes?.some(
      (id) => id === currentUserId || id?._id === currentUserId
    ) || false
  );
  const [likesCount, setLikesCount] = useState(post?.likes?.length || 0);
  const [isSaved, setIsSaved] = useState(checkIfSaved());
  const [showShare, setShowShare] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState(post?.comments || []);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Options Menu & Edit Modal States
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post?.caption || "");
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);

  const postContainerRef = useRef(null);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const clickTimeoutRef = useRef(null);

  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  const authorId = (post?.author?._id || post?.author?.id || post?.author)?.toString();
  const isOwnPost = Boolean(
    currentUserId && authorId && currentUserId.toString() === authorId
  );

  const authorName =
    post?.author?.name || (isOwnPost ? (userData?.name || "You") : "Vistagram User");

  const authorUsername =
    post?.author?.username ||
    post?.author?.userName ||
    (isOwnPost ? (userData?.username || userData?.userName || "you") : "user");

  const authorImage =
    post?.author?.profileImage ||
    (isOwnPost ? userData?.profileImage : null) ||
    dp;

  const initiallyFollowing = userData?.following?.some(
    (id) => (id._id || id || "").toString() === authorId
  ) || false;
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    setIsSaved(checkIfSaved());
  }, [userData?.savedPosts, post?._id]);

  useEffect(() => {
    if (post?.likes) {
      const liked = post.likes.some(
        (id) => (id._id || id)?.toString() === currentUserId?.toString()
      );
      setIsLiked(liked);
      setLikesCount(post.likes.length);
    }
  }, [post?.likes, currentUserId]);

  useEffect(() => {
    if (post?.comments) {
      setCommentsList(post.comments);
    }
  }, [post?.comments]);

  // Auto pause video & audio when post scrolls out of viewport
  useEffect(() => {
    if (post?.mediaType !== "video") return;
    const container = postContainerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video
              .play()
              .then(() => setVideoPlaying(true))
              .catch(() => setVideoPlaying(false));
          } else {
            video.pause();
            setVideoPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [post?.mediaType]);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setShowMenu(false);
    if (showMenu) {
      window.addEventListener("click", handleOutsideClick);
    }
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [showMenu]);

  const toggleVideoPlay = (e) => {
    if (e) e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => setVideoPlaying(true))
        .catch(() => {});
    } else {
      v.pause();
      setVideoPlaying(false);
    }
  };

  const handleMediaClick = (e) => {
    e.stopPropagation();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      triggerDoubleTapLike();
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        if (post?.mediaType === "video") {
          navigate("/reels", { state: { postId: post._id } });
        }
      }, 250);
    }
  };

  const triggerDoubleTapLike = () => {
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
    if (!isLiked) {
      handleLike();
    }
  };

  const toggleVideoMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setVideoMuted(v.muted);
  };

  const handleVideoTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setVideoProgress((v.currentTime / v.duration) * 100);
  };

  const handleProgressClick = (e) => {
    e.stopPropagation();
    const bar = progressRef.current;
    const v = videoRef.current;
    if (!bar || !v) return;
    const rect = bar.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  };

  const handleFollow = async () => {
    if (!currentUserId || isOwnPost || followLoading) return;
    setFollowLoading(true);
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    try {
      await axios.put(
        `${serverUrl}/api/users/follow/${authorId}`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error following user:", error);
      setIsFollowing(!nextFollowing);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    if (currentUserId) {
      dispatch(toggleLikePost({ postId: post._id, userId: currentUserId }));
    }

    try {
      await axios.put(`${serverUrl}/api/posts/${post._id}/like`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Error liking post:", error);
      setIsLiked(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleSave = async () => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      const res = await axios.put(
        `${serverUrl}/api/posts/${post._id}/save`,
        {},
        { withCredentials: true }
      );
      if (res.data?.savedPosts && userData) {
        dispatch(setUserData({ ...userData, savedPosts: res.data.savedPosts }));
      }
    } catch (error) {
      console.error("Error saving post:", error);
      setIsSaved(!nextSaved);
    }
  };

  const handleDeletePost = async (e) => {
    if (e) e.stopPropagation();
    if (isDeletingPost) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    setIsDeletingPost(true);
    setShowMenu(false);

    try {
      await axios.delete(`${serverUrl}/api/posts/${post._id}`, {
        withCredentials: true,
      });
      dispatch(removePost(post._id));
    } catch (err) {
      console.error("Error deleting post:", err);
      alert(err.response?.data?.message || "Failed to delete post");
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleSaveEditPost = async (e) => {
    e.preventDefault();
    if (isEditingPost) return;

    setIsEditingPost(true);
    try {
      const res = await axios.put(
        `${serverUrl}/api/posts/${post._id}/edit`,
        { caption: editCaption },
        { withCredentials: true }
      );

      if (res.data?.post) {
        dispatch(updatePost(res.data.post));
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Error editing post:", err);
      alert(err.response?.data?.message || "Failed to update post");
    } finally {
      setIsEditingPost(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    const newCommentMsg = commentInput.trim();

    try {
      const response = await axios.post(
        `${serverUrl}/api/posts/${post._id}/comment`,
        { message: newCommentMsg },
        { withCredentials: true }
      );

      if (response.data?.comments) {
        setCommentsList(response.data.comments);
      } else {
        const createdComment = {
          _id: Date.now().toString(),
          message: newCommentMsg,
          author: {
            _id: currentUserId,
            name: userData?.name || "You",
            username: userData?.username || "you",
            profileImage: userData?.profileImage || dp,
          },
        };
        setCommentsList((prev) => [...prev, createdComment]);
        dispatch(addCommentToPost({ postId: post._id, comment: createdComment }));
      }
      setCommentInput("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <article
      ref={postContainerRef}
      className="w-full bg-black border-b sm:border border-gray-900/90 text-white sm:rounded-3xl shadow-none sm:shadow-lg overflow-hidden mb-4 sm:mb-6 transition-all hover:border-gray-800"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-900/80">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate(`/profile/${authorUsername}`)}
        >
          <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-800 bg-gray-900 flex-shrink-0">
            <img
              src={authorImage}
              alt={authorName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs sm:text-sm font-bold text-white leading-tight hover:text-blue-400 transition">
              {authorName}
            </span>
            <span className="text-[11px] font-medium text-gray-400">@{authorUsername}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {!isOwnPost && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                isFollowing
                  ? "bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800"
                  : "bg-blue-600 text-white hover:bg-blue-500 shadow-sm"
              } disabled:opacity-50`}
            >
              {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
            </button>
          )}

          {/* 3 Dot Options Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="text-gray-400 hover:text-white p-1.5 cursor-pointer transition rounded-full hover:bg-gray-900"
              aria-label="Post options"
            >
              <FiMoreHorizontal size={20} />
            </button>

            {/* Options Dropdown Menu */}
            {showMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-9 w-44 bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150"
              >
                {isOwnPost ? (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsEditing(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-200 hover:bg-gray-900 transition cursor-pointer text-left"
                    >
                      <FiEdit2 size={14} className="text-blue-400" />
                      <span>Edit Post</span>
                    </button>
                    <button
                      onClick={handleDeletePost}
                      disabled={isDeletingPost}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition cursor-pointer text-left border-t border-gray-900 disabled:opacity-50"
                    >
                      <FiTrash2 size={14} />
                      <span>{isDeletingPost ? "Deleting..." : "Delete Post"}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleFollow();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-200 hover:bg-gray-900 transition cursor-pointer text-left"
                    >
                      <span className="text-blue-400">{isFollowing ? "Unfollow User" : "Follow User"}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        alert("Post reported successfully.");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition cursor-pointer text-left border-t border-gray-900"
                    >
                      <span>Report Post</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Display Container */}
      <div
        className="w-full bg-black flex items-center justify-center overflow-hidden relative min-h-[320px] select-none"
        onClick={handleMediaClick}
      >
        {/* Double Tap Heart Pop Animation */}
        {showHeartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in duration-200">
            <FaHeart className="text-red-500 text-8xl drop-shadow-2xl animate-bounce" />
          </div>
        )}

        {post?.mediaType === "video" ? (
          <div className="relative w-full h-full flex items-center justify-center group">
            <video
              ref={videoRef}
              src={post?.media}
              className="w-full max-h-[620px] object-contain bg-black cursor-pointer"
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={() => setVideoPlaying(false)}
              loop={false}
              playsInline
            />

            {/* Mute Button */}
            <button
              onClick={toggleVideoMute}
              className="absolute top-3 right-3 z-20 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition cursor-pointer"
            >
              {videoMuted ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
            </button>

            {/* Play / Pause  Button */}
            <div className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-200 ${
              videoPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
            }`}>
              <button
                onClick={toggleVideoPlay}
                className="pointer-events-auto bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full p-4 border border-white/20 hover:scale-110 transition cursor-pointer shadow-2xl"
                aria-label={videoPlaying ? "Pause Video" : "Play Video"}
              >
                {videoPlaying ? (
                  <FiPause size={28} className="text-white" />
                ) : (
                  <FiPlay size={28} className="text-white ml-0.5" />
                )}
              </button>
            </div>

            {/* Custom Bottom Progress Bar */}
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-800/80 cursor-pointer z-20 group"
            >
              <div
                className="h-full bg-blue-500 transition-all duration-100 group-hover:bg-blue-400"
                style={{ width: `${videoProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <img
            src={post?.media}
            alt={post?.caption || "Vistagram Post"}
            className="w-full max-h-[620px] object-contain bg-black cursor-pointer"
          />
        )}
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-gray-900/80">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-white hover:text-red-500 transition cursor-pointer group"
          >
            {isLiked ? (
              <FaHeart className="text-red-500 text-xl group-hover:scale-110 transition-transform" />
            ) : (
              <FaRegHeart className="text-xl group-hover:scale-110 transition-transform" />
            )}
            <span className="text-xs font-bold text-white">{likesCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-white hover:text-blue-400 transition cursor-pointer group"
          >
            <FaRegComment className="text-xl group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">
              {commentsList.length}
            </span>
          </button>

          <button
            onClick={() => setShowShare(true)}
            className="text-white hover:text-blue-400 transition cursor-pointer group"
            aria-label="Share Post"
          >
            <FiSend className="text-xl group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <button
          onClick={handleSave}
          className="text-white hover:text-yellow-500 transition cursor-pointer group"
        >
          {isSaved ? (
            <FaBookmark className="text-yellow-500 text-xl group-hover:scale-110 transition-transform" />
          ) : (
            <FaRegBookmark className="text-xl group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* Caption Section */}
      {post?.caption && (
        <div className="px-4 sm:px-5 pb-3.5 text-left">
          <p className="text-xs md:text-sm text-gray-200 leading-relaxed">
            <span
              className="font-bold text-white mr-2 cursor-pointer hover:underline"
              onClick={() => navigate(`/profile/${authorUsername}`)}
            >
              {authorUsername}
            </span>
            {post.caption}
          </p>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 sm:px-5 py-3.5 bg-gray-950/80 border-t border-gray-900 flex flex-col gap-3">
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {commentsList.length > 0 ? (
              commentsList.map((c, idx) => {
                const commentUser = c.author || {};
                const cUsername = commentUser.username || commentUser.userName || commentUser.name || "user";
                const cImage = commentUser.profileImage || dp;

                return (
                  <div key={c._id || idx} className="flex items-start gap-2 text-xs text-left">
                    <div
                      onClick={() => navigate(`/profile/${cUsername}`)}
                      className="w-7 h-7 rounded-full overflow-hidden border border-gray-800 bg-gray-900 flex-shrink-0 cursor-pointer mt-0.5"
                    >
                      <img
                        src={cImage}
                        alt={cUsername}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <span
                        onClick={() => navigate(`/profile/${cUsername}`)}
                        className="font-bold text-white cursor-pointer hover:underline"
                      >
                        {cUsername}
                      </span>
                      <span className="text-gray-300 mt-0.5 break-words">{c.message}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-500 py-2">No comments yet. Be the first to comment!</p>
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2 border-t border-gray-900">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-xs bg-gray-900 text-white border border-gray-800 rounded-full px-4 py-2 outline-none focus:border-gray-600 transition placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={!commentInput.trim() || isSubmittingComment}
              className="text-xs font-bold text-blue-500 hover:text-blue-400 disabled:opacity-40 cursor-pointer px-2"
            >
              Post
            </button>
          </form>
        </div>
      )}

      {/* Edit Caption Modal */}
      {isEditing && (
        <div
          onClick={() => setIsEditing(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-gray-900 pb-3">
              <h3 className="text-sm font-bold text-white">Edit Post Caption</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-900 transition cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={4}
              className="w-full rounded-2xl bg-gray-900 border border-gray-800 p-3.5 text-white text-sm outline-none focus:border-gray-700 transition resize-none placeholder-gray-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-900">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-900 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditPost}
                disabled={isEditingPost}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {isEditingPost ? <ClipLoader size={14} color="#ffffff" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showShare && (
        <ReelShareModal
          reel={{
            _id: post._id,
            media: post.media,
            mediaType: post.mediaType || "image",
            caption: post.caption,
            author: post.author,
          }}
          onClose={() => setShowShare(false)}
        />
      )}
    </article>
  );
}

export default Post;