import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import dp from "../assets/dp.png";
import { FaHeart, FaRegHeart, FaRegComment } from "react-icons/fa6";
import { FiSend, FiVolume2, FiVolumeX, FiPlay, FiX, FiArrowLeft, FiMusic } from "react-icons/fi";
import { toggleLikeReel, addCommentToReel } from "../redux/reel.Slice";
import { setUserData } from "../redux/userSlice";

function ReelCard({ reel }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  const currentUserId = userData?._id || userData?.id;
  const authorId = reel?.author?._id || reel?.author?.id;
  const authorName = reel?.author?.name || "Vistagram User";
  const authorUsername = reel?.author?.username || reel?.author?.userName || "user";
  const authorImage = reel?.author?.profileImage || dp;

  const isOwnReel = currentUserId && authorId && currentUserId === authorId;

  const videoRef = useRef(null);
  const commentRef = useRef(null);
  const clickTimeoutRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  const [isLiked, setIsLiked] = useState(
    reel?.likes?.some((id) => id === currentUserId || id?._id === currentUserId) || false
  );
  const [likesCount, setLikesCount] = useState(reel?.likes?.length || 0);

  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState(reel?.comments || []);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const checkIfFollowing = () => {
    if (!userData?.following || !authorId) return false;
    return userData.following.some(
      (id) => (id._id || id || "").toString() === authorId.toString()
    );
  };

  const [isFollowing, setIsFollowing] = useState(checkIfFollowing());
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (reel?.comments) {
      setCommentsList(reel.comments);
    }
  }, [reel?.comments]);

  // Auto play when visible in viewport
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Handle click outside comment box to close it automatically
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (commentRef.current && !commentRef.current.contains(event.target)) {
        setShowComments(false);
      }
    };

    if (showComments) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showComments]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSingleOrDoubleClick = (e) => {
    e.stopPropagation();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      triggerDoubleTapLike();
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        togglePlay();
      }, 250);
    }
  };

  const triggerDoubleTapLike = async () => {
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);

    if (!isLiked) {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);

      if (currentUserId) {
        dispatch(toggleLikeReel({ reelId: reel._id, userId: currentUserId }));
      }

      try {
        await axios.put(`${serverUrl}/api/reels/${reel._id}/like`, {}, { withCredentials: true });
      } catch (error) {
        console.error("Error liking reel on double click:", error);
      }
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const progressPercent = (video.currentTime / video.duration) * 100;
    setVideoProgress(progressPercent);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * video.duration;
    video.currentTime = newTime;
    setVideoProgress((clickX / rect.width) * 100);
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    if (currentUserId) {
      dispatch(toggleLikeReel({ reelId: reel._id, userId: currentUserId }));
    }

    try {
      await axios.put(`${serverUrl}/api/reels/${reel._id}/like`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Error liking reel:", error);
      setIsLiked(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!currentUserId || isOwnReel || followLoading) return;
    setFollowLoading(true);
    const nextState = !isFollowing;
    setIsFollowing(nextState);

    try {
      await axios.put(
        `${serverUrl}/api/users/follow/${authorId}`,
        {},
        { withCredentials: true }
      );

      if (userData) {
        let updatedFollowing = [...(userData.following || [])];
        if (nextState) {
          if (!updatedFollowing.some((id) => (id._id || id).toString() === authorId.toString())) {
            updatedFollowing.push(reel.author);
          }
        } else {
          updatedFollowing = updatedFollowing.filter(
            (id) => (id._id || id).toString() !== authorId.toString()
          );
        }
        dispatch(setUserData({ ...userData, following: updatedFollowing }));
      }
    } catch (error) {
      console.error("Error following user:", error);
      setIsFollowing(!nextState);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    const newMsg = commentInput.trim();

    try {
      const res = await axios.post(
        `${serverUrl}/api/reels/${reel._id}/comment`,
        { message: newMsg },
        { withCredentials: true }
      );

      if (res.data?.comments) {
        setCommentsList(res.data.comments);
      } else {
        const createdComment = {
          _id: Date.now().toString(),
          message: newMsg,
          author: {
            _id: currentUserId,
            name: userData?.name || "You",
            username: userData?.username || userData?.userName || "you",
            profileImage: userData?.profileImage || dp,
          },
        };

        setCommentsList((prev) => [...prev, createdComment]);
        dispatch(addCommentToReel({ reelId: reel._id, comment: createdComment }));
      }
      setCommentInput("");
    } catch (error) {
      console.error("Error adding comment to reel:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="w-full h-full relative snap-start snap-always flex items-center justify-center bg-black overflow-hidden select-none">
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        src={reel?.media}
        className="w-full h-full object-cover cursor-pointer"
        loop
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onClick={handleSingleOrDoubleClick}
      />

      {/* Gradient Bottom Vignette Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

      {/* Double Tap Heart Pop Animation */}
      {showHeartAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in duration-200">
          <FaHeart className="text-red-500 text-8xl drop-shadow-2xl animate-bounce" />
        </div>
      )}

      {/* Top Left Back Control */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(-1);
        }}
        className="absolute top-5 left-5 z-20 bg-black/50 backdrop-blur-md text-white p-2.5 rounded-full border border-white/10 hover:bg-black/70 transition cursor-pointer"
        aria-label="Go Back"
      >
        <FiArrowLeft size={18} />
      </button>

      {/* Center Play/Pause Indicator Overlay */}
      {!isPlaying && (
        <div
          onClick={handleSingleOrDoubleClick}
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 z-10"
        >
          <div className="bg-black/50 backdrop-blur-md rounded-full p-5 border border-white/20">
            <FiPlay size={36} className="text-white ml-1" />
          </div>
        </div>
      )}

      {/* Top Right Mute Control */}
      <button
        onClick={toggleMute}
        className="absolute top-5 right-5 z-20 bg-black/50 backdrop-blur-md text-white p-2.5 rounded-full border border-white/10 hover:bg-black/70 transition cursor-pointer"
      >
        {isMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
      </button>

      {/* Right Side Action Bar */}
      <div className="absolute right-4 bottom-20 z-20 flex flex-col items-center gap-6 text-white">
        {/* Like Action */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 cursor-pointer group"
        >
          <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:scale-110 transition">
            {isLiked ? (
              <FaHeart className="text-red-500 text-2xl" />
            ) : (
              <FaRegHeart className="text-white text-2xl" />
            )}
          </div>
          <span className="text-xs font-semibold drop-shadow">{likesCount}</span>
        </button>

        {/* Comment Action */}
        <button
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1 cursor-pointer group"
        >
          <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:scale-110 transition">
            <FaRegComment className="text-white text-2xl" />
          </div>
          <span className="text-xs font-semibold drop-shadow">{commentsList?.length || 0}</span>
        </button>

        {/* Share Action */}
        <button className="flex flex-col items-center gap-1 cursor-pointer group">
          <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:scale-110 transition">
            <FiSend className="text-white text-2xl" />
          </div>
        </button>
      </div>

      {/* Bottom Info Bar Overlay (Instagram Layout) */}
      <div className="absolute bottom-6 left-4 right-20 z-20 text-white flex flex-col gap-2 text-left">
        {/* Author Avatar + Username + Follow Button */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => navigate(`/profile/${authorUsername}`)}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/80 cursor-pointer shadow-lg flex-shrink-0 hover:scale-105 transition"
          >
            <img
              src={authorImage}
              alt={authorName}
              className="w-full h-full object-cover"
            />
          </div>

          <span
            onClick={() => navigate(`/profile/${authorUsername}`)}
            className="font-bold text-sm text-white hover:underline cursor-pointer tracking-wide drop-shadow"
          >
            @{authorUsername}
          </span>

          {!isOwnReel && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`text-xs font-bold px-3 py-1 rounded-full border transition cursor-pointer ${
                isFollowing
                  ? "bg-white/20 border-white/30 text-white hover:bg-white/30"
                  : "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {/* Reel Caption */}
        {reel?.caption && (
          <p className="text-xs text-gray-100 line-clamp-2 drop-shadow leading-relaxed max-w-sm pl-0.5">
            {reel.caption}
          </p>
        )}

        {/* Audio Ticker */}
        <div className="flex items-center gap-2 text-[11px] text-gray-300 font-medium pt-0.5">
          <FiMusic size={12} className="text-gray-300 animate-spin duration-3000" />
          <span className="truncate">{authorName} · Original Audio</span>
        </div>
      </div>

      {/* Interactive Bottom Video Progress Bar */}
      <div
        onClick={handleSeek}
        className="absolute bottom-0 left-0 w-full h-1.5 bg-white/20 hover:h-2.5 transition-all duration-200 cursor-pointer z-30 group"
      >
        <div
          className="h-full bg-white transition-all duration-100 rounded-r-full shadow-md"
          style={{ width: `${videoProgress}%` }}
        />
      </div>

      {/* Instagram-Style Comments Drawer Modal */}
      {showComments && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex flex-col justify-end transition-opacity duration-300">
          <div
            ref={commentRef}
            className="w-full bg-gray-950 text-white rounded-t-3xl border-t border-gray-800 p-5 max-h-[70%] flex flex-col gap-3 shadow-2xl transition-transform transform translate-y-0 duration-300 ease-out animate-in slide-in-from-bottom"
          >
            {/* Instagram Pull/Drag Indicator */}
            <div
              className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-1 cursor-pointer hover:bg-gray-500 transition"
              onClick={() => setShowComments(false)}
            />

            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Comments ({commentsList.length})
              </h3>
              <button
                onClick={() => setShowComments(false)}
                className="text-gray-400 hover:text-white p-1 cursor-pointer transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-1 py-1 no-scrollbar">
              {commentsList.length > 0 ? (
                commentsList.map((c, idx) => {
                  const commentUser =
                    typeof c.author === "object" && c.author !== null ? c.author : {};
                  const isCurrentLoggedUser =
                    (c.author?._id || c.author || "").toString() === (currentUserId || "").toString();

                  const cUsername =
                    commentUser.username ||
                    commentUser.userName ||
                    commentUser.name ||
                    (isCurrentLoggedUser ? (userData?.username || userData?.userName) : "user");

                  const cImage =
                    commentUser.profileImage ||
                    (isCurrentLoggedUser ? userData?.profileImage : null) ||
                    dp;

                  return (
                    <div key={c._id || idx} className="flex items-start gap-3 text-xs text-gray-200">
                      <div
                        onClick={() => navigate(`/profile/${cUsername}`)}
                        className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 bg-gray-900 flex-shrink-0 cursor-pointer"
                      >
                        <img src={cImage} alt={cUsername} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col text-left flex-1">
                        <div className="flex items-baseline gap-2">
                          <span
                            onClick={() => navigate(`/profile/${cUsername}`)}
                            className="font-bold text-white cursor-pointer hover:underline"
                          >
                            {cUsername}
                          </span>
                          <span className="text-[10px] text-gray-500">Just now</span>
                        </div>
                        <span className="text-gray-300 mt-1 break-words leading-relaxed">{c.message}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-1 text-center">
                  <p className="text-sm font-bold text-gray-300">No comments yet</p>
                  <p className="text-xs text-gray-500">Start the conversation on this reel.</p>
                </div>
              )}
            </div>

            {/* Add Comment Input Form */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-3 border-t border-gray-800">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-700 bg-gray-900 flex-shrink-0">
                <img src={userData?.profileImage || dp} alt="Your avatar" className="w-full h-full object-cover" />
              </div>
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={`Add a comment as ${userData?.username || "user"}...`}
                className="flex-1 text-xs bg-gray-900 border border-gray-800 rounded-full px-4 py-2.5 outline-none focus:border-gray-700 text-white transition"
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
        </div>
      )}
    </div>
  );
}

export default ReelCard;
