import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import dp from "../assets/dp.png";
import { FaHeart, FaRegHeart, FaRegComment } from "react-icons/fa6";
import { FiSend, FiVolume2, FiVolumeX, FiPlay, FiX, FiArrowLeft } from "react-icons/fi";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

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
      await axios.post(
        `${serverUrl}/api/reels/${reel._id}/comment`,
        { message: newMsg },
        { withCredentials: true }
      );

      const createdComment = {
        _id: Date.now().toString(),
        message: newMsg,
        author: {
          _id: currentUserId,
          name: userData?.name || "You",
          username: userData?.username || "you",
          profileImage: userData?.profileImage || dp,
        },
      };

      setCommentsList((prev) => [...prev, createdComment]);
      dispatch(addCommentToReel({ reelId: reel._id, comment: createdComment }));
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
        onClick={togglePlay}
      />

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
          onClick={togglePlay}
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
      <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center gap-6 text-white">
        {/* Author Profile Avatar */}
        <div
          onClick={() => navigate(`/profile/${authorUsername}`)}
          className="w-11 h-11 rounded-full overflow-hidden border-2 border-white cursor-pointer shadow-lg hover:scale-105 transition"
        >
          <img
            src={authorImage}
            alt={authorName}
            className="w-full h-full object-cover"
          />
        </div>

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

      {/* Bottom Info Bar Overlay */}
      <div className="absolute bottom-6 left-4 right-20 z-20 text-white flex flex-col gap-2.5 text-left">
        <div className="flex items-center gap-3">
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
              className={`text-xs font-bold px-3.5 py-1 rounded-full border transition cursor-pointer ${
                isFollowing
                  ? "bg-white/20 border-white/30 text-white hover:bg-white/30"
                  : "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {reel?.caption && (
          <p className="text-xs text-gray-200 line-clamp-2 drop-shadow leading-relaxed max-w-md">
            {reel.caption}
          </p>
        )}
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

      {/* Comments Drawer Modal */}
      {showComments && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-40 flex flex-col justify-end">
          <div className="w-full bg-gray-950 text-white rounded-t-3xl border-t border-gray-800 p-5 max-h-[65%] flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Comments ({commentsList.length})
              </h3>
              <button
                onClick={() => setShowComments(false)}
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
              {commentsList.length > 0 ? (
                commentsList.map((c, idx) => {
                  const commentUser = c.author || {};
                  const cUsername = commentUser.username || commentUser.userName || commentUser.name || "user";
                  const cImage = commentUser.profileImage || dp;

                  return (
                    <div key={c._id || idx} className="flex items-start gap-2.5 text-xs text-gray-200">
                      <div
                        onClick={() => navigate(`/profile/${cUsername}`)}
                        className="w-7 h-7 rounded-full overflow-hidden border border-gray-700 bg-gray-900 flex-shrink-0 cursor-pointer"
                      >
                        <img src={cImage} alt={cUsername} className="w-full h-full object-cover" />
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
                <p className="text-xs text-gray-500 py-6 text-center">No comments yet. Start the conversation!</p>
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2 border-t border-gray-800">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment to this reel..."
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
