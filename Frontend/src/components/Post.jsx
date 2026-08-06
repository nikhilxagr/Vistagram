import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import dp from "../assets/dp.png";
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark } from "react-icons/fa6";
import { FaRegComment } from "react-icons/fa";
import { FiSend, FiMoreHorizontal, FiPlay, FiPause, FiVolume2, FiVolumeX } from "react-icons/fi";
import { toggleLikePost, addCommentToPost } from "../redux/post.Slice";
import { setUserData } from "../redux/userSlice";

function Post({ post }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  const currentUserId = userData?._id || userData?.id;

  const [isLiked, setIsLiked] = useState(
    post?.likes?.some((id) => id === currentUserId || id?._id === currentUserId) || false
  );
  const [likesCount, setLikesCount] = useState(post?.likes?.length || 0);

  const checkIfSaved = () => {
    if (!userData?.savedPosts || !post?._id) return false;
    return userData.savedPosts.some((s) => {
      const savedId = s._id || s.id || s;
      return savedId?.toString() === post._id?.toString();
    });
  };

  const [isSaved, setIsSaved] = useState(checkIfSaved());
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState(post?.comments || []);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const authorId = post?.author?._id || post?.author?.id;
  const authorName = post?.author?.name || "Vistagram User";
  const authorUsername = post?.author?.username || post?.author?.userName || "user";
  const authorImage = post?.author?.profileImage || dp;

  const isOwnPost = currentUserId && authorId && currentUserId === authorId;

  const initiallyFollowing = userData?.following?.some(
    (id) => id === authorId || id?._id === authorId
  ) || false;
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    setIsSaved(checkIfSaved());
  }, [userData?.savedPosts, post?._id]);

  useEffect(() => {
    if (post?.comments) {
      setCommentsList(post.comments);
    }
  }, [post?.comments]);

  const toggleVideoPlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setVideoPlaying(true); }
    else { v.pause(); setVideoPlaying(false); }
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
    <article className="w-full max-w-xl md:max-w-2xl bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate(`/profile/${authorUsername}`)}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
            <img
              src={authorImage}
              alt={authorName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition">
              {authorName}
            </span>
            <span className="text-xs font-medium text-gray-400">@{authorUsername}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOwnPost && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                isFollowing
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-blue-500 text-white hover:bg-blue-600 shadow-sm"
              } disabled:opacity-50`}
            >
              {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
            </button>
          )}
          <button className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
            <FiMoreHorizontal size={20} />
          </button>
        </div>
      </div>

      <div className="w-full bg-gray-950 flex items-center justify-center overflow-hidden relative min-h-[300px]">
        {post?.mediaType === "video" ? (
          <div className="relative w-full">
            <video
              ref={videoRef}
              src={post?.media}
              className="w-full max-h-[580px] object-contain bg-black cursor-pointer"
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={() => setVideoPlaying(false)}
              onClick={toggleVideoPlay}
              loop={false}
              playsInline
            />

            <button
              onClick={toggleVideoMute}
              className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition"
            >
              {videoMuted
                ? <FiVolumeX size={18} />
                : <FiVolume2 size={18} />}
            </button>

            <button
              onClick={toggleVideoPlay}
              className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer group"
              style={{ background: "transparent" }}
              tabIndex={-1}
            >
              <div className={`transition-all duration-200 ${
                videoPlaying
                  ? "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                  : "opacity-100 scale-100"
              }`}>
                <div className="bg-black/40 backdrop-blur-sm rounded-full p-4 border border-white/20">
                  {videoPlaying
                    ? <FiPause size={32} className="text-white" />
                    : <FiPlay size={32} className="text-white ml-1" />}
                </div>
              </div>
            </button>

            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 cursor-pointer"
            >
              <div
                className="h-full bg-white transition-all duration-100"
                style={{ width: `${videoProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <img
            src={post?.media || dp}
            alt={post?.caption || "Post Media"}
            className="w-full max-h-[580px] object-cover"
          />
        )}
      </div>

      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="cursor-pointer transition transform active:scale-125 hover:opacity-80"
            aria-label="Like Post"
          >
            {isLiked ? (
              <FaHeart className="text-red-500 text-xl" />
            ) : (
              <FaRegHeart className="text-gray-700 text-xl hover:text-red-500 transition" />
            )}
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="cursor-pointer text-gray-700 hover:text-blue-600 transition"
            aria-label="Comment"
          >
            <FaRegComment className="text-xl" />
          </button>

          <button className="cursor-pointer text-gray-700 hover:text-blue-600 transition" aria-label="Share">
            <FiSend className="text-xl" />
          </button>
        </div>

        <button
          onClick={handleSave}
          className="cursor-pointer text-gray-700 hover:text-black transition"
          aria-label="Save Post"
        >
          {isSaved ? (
            <FaBookmark className="text-black text-xl" />
          ) : (
            <FaRegBookmark className="text-xl" />
          )}
        </button>
      </div>

      <div className="px-5 pb-3 text-left">
        <p className="text-xs font-bold text-gray-900 mb-1">
          {likesCount} {likesCount === 1 ? "like" : "likes"}
        </p>

        {post?.caption && (
          <p className="text-xs text-gray-800 leading-normal">
            <span
              onClick={() => navigate(`/profile/${authorUsername}`)}
              className="font-bold text-gray-900 cursor-pointer mr-1.5 hover:underline"
            >
              {authorUsername}
            </span>
            {post.caption}
          </p>
        )}

        {commentsList?.length > 0 && (
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-[11px] font-semibold text-gray-400 mt-1.5 cursor-pointer hover:text-gray-600 block"
          >
            {showComments
              ? "Hide comments"
              : `View all ${commentsList.length} ${commentsList.length === 1 ? "comment" : "comments"}`}
          </button>
        )}
      </div>

      {showComments && (
        <div className="px-5 pb-4 border-t border-gray-100 pt-3 flex flex-col gap-3 text-left bg-gray-50/50">
          <div className="max-h-48 overflow-y-auto flex flex-col gap-3 pr-1">
            {commentsList.map((c, idx) => {
              const commentUser = c.author || {};
              const cUsername = commentUser.username || commentUser.userName || commentUser.name || "user";
              const cImage = commentUser.profileImage || dp;

              return (
                <div key={c._id || idx} className="flex items-center gap-2.5 text-xs text-gray-800">
                  <div
                    onClick={() => navigate(`/profile/${cUsername}`)}
                    className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                  >
                    <img
                      src={cImage}
                      alt={cUsername}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    <span
                      onClick={() => navigate(`/profile/${cUsername}`)}
                      className="font-bold text-gray-900 cursor-pointer hover:underline hover:text-blue-600 transition"
                    >
                      {cUsername}
                    </span>
                    <span className="text-gray-700 break-words">{c.message}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleAddComment} className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-xs bg-white border border-gray-200 rounded-full px-4 py-2.5 outline-none focus:border-gray-400 transition shadow-sm"
            />
            <button
              type="submit"
              disabled={!commentInput.trim() || isSubmittingComment}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-40 cursor-pointer px-2"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

export default Post;
