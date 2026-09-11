import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import dp from "../assets/dp.png";
import { FaHeart, FaRegHeart, FaRegComment, FaBookmark, FaRegBookmark } from "react-icons/fa6";
import { FiSend, FiVolume2, FiVolumeX, FiPlay, FiPause, FiX, FiArrowLeft, FiMusic, FiTrash2, FiDownload } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import { toggleLikeReel, addCommentToReel } from "../redux/reel.Slice";
import { setUserData } from "../redux/userSlice";
import ReelShareModal from "./ReelShareModal";
import CommentsDrawer from "./CommentsDrawer";

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

  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState(reel?.comments || []);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [selectedCommentToDelete, setSelectedCommentToDelete] = useState(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const commentPressTimerRef = useRef(null);

  const checkIfFollowing = () => {
    if (!userData?.following || !authorId) return false;
    return userData.following.some(
      (id) => (id._id || id || "").toString() === authorId.toString()
    );
  };

  const [isFollowing, setIsFollowing] = useState(checkIfFollowing());
  const [followLoading, setFollowLoading] = useState(false);

  const checkIfSaved = () => {
    if (!userData?.savedPosts || !reel?._id) return false;
    return userData.savedPosts.some(
      (p) => (p._id || p || "").toString() === reel._id.toString()
    );
  };

  const [isSaved, setIsSaved] = useState(checkIfSaved());

  useEffect(() => {
    setIsSaved(checkIfSaved());
  }, [userData?.savedPosts, reel?._id]);

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!currentUserId || !reel?._id) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    try {
      const res = await axios.put(
        `${serverUrl}/api/posts/${reel._id}/save`,
        {},
        { withCredentials: true }
      );

      if (res.data?.savedPosts && userData) {
        dispatch(setUserData({ ...userData, savedPosts: res.data.savedPosts }));
      }
    } catch (error) {
      console.error("Error saving reel:", error);
      setIsSaved(!nextSaved);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadReel = async (e) => {
    if (e) e.stopPropagation();
    if (!reel?.media || isDownloading) return;
    setIsDownloading(true);

    try {
      const response = await fetch(reel.media);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cleanUsername = authorUsername || "user";
      link.download = `Vistagram_Reel_${cleanUsername}_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Reel fetch download failed, fallback:", err);
      const link = document.createElement("a");
      link.href = reel.media;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = `Vistagram_Reel_${authorUsername || "reel"}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (reel?.comments) {
      setCommentsList(reel.comments);
    }
  }, [reel?.comments]);

  // Listen for other media playing to pause this reel
  useEffect(() => {
    const handleOtherMedia = (e) => {
      const activeId = e.detail?.postId?.toString();
      const myId = reel?._id?.toString();
      if (activeId && myId && activeId !== myId) {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    };
    window.addEventListener("vistagram_media_play", handleOtherMedia);
    return () => window.removeEventListener("vistagram_media_play", handleOtherMedia);
  }, [reel?._id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            window.dispatchEvent(
              new CustomEvent("vistagram_media_play", { detail: { postId: reel?._id } })
            );
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: [0, 0.6] }
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [reel?._id]);

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
      window.dispatchEvent(
        new CustomEvent("vistagram_media_play", { detail: { postId: reel?._id } })
      );
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

  const handleCommentPressStart = (c) => {
    const commentAuthorId = (c.author?._id || c.author || "").toString();
    const isCommentAuthor = currentUserId && commentAuthorId === currentUserId.toString();
    const isReelAuthor = currentUserId && authorId === currentUserId.toString();

    if (!isCommentAuthor && !isReelAuthor) return;

    commentPressTimerRef.current = setTimeout(() => {
      setSelectedCommentToDelete(c);
    }, 500);
  };

  const handleCommentPressEnd = () => {
    if (commentPressTimerRef.current) {
      clearTimeout(commentPressTimerRef.current);
      commentPressTimerRef.current = null;
    }
  };

  const handleDeleteComment = async () => {
    if (!selectedCommentToDelete || !reel?._id || isDeletingComment) return;
    const commentId = selectedCommentToDelete._id;
    setIsDeletingComment(true);

    try {
      const res = await axios.delete(
        `${serverUrl}/api/posts/${reel._id}/comment/${commentId}`,
        { withCredentials: true }
      );

      if (res.data?.comments) {
        setCommentsList(res.data.comments);
      } else {
        setCommentsList((prev) => prev.filter((c) => (c._id || c.id) !== commentId));
      }
      setSelectedCommentToDelete(null);
    } catch (err) {
      console.error("Error deleting reel comment:", err);
      setCommentsList((prev) => prev.filter((c) => (c._id || c.id) !== commentId));
      setSelectedCommentToDelete(null);
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!currentUserId || !reel?._id || !commentId) return;

    setCommentsList((prev) =>
      prev.map((c) => {
        if ((c._id || c.id) === commentId) {
          const likes = Array.isArray(c.likes) ? [...c.likes] : [];
          const alreadyLiked = likes.some(
            (id) => (id._id || id || "").toString() === currentUserId.toString()
          );
          const updatedLikes = alreadyLiked
            ? likes.filter((id) => (id._id || id || "").toString() !== currentUserId.toString())
            : [...likes, currentUserId];
          return { ...c, likes: updatedLikes };
        }
        return c;
      })
    );

    try {
      const res = await axios.put(
        `${serverUrl}/api/posts/${reel._id}/comment/${commentId}/like`,
        {},
        { withCredentials: true }
      );
      if (res.data?.comments) {
        setCommentsList(res.data.comments);
      }
    } catch (err) {
      console.error("Error liking reel comment:", err);
    }
  };

  return (
    <div className="w-full h-full relative snap-start snap-always flex items-center justify-center bg-black overflow-hidden select-none group">
      <video
        ref={videoRef}
        src={reel?.media}
        className="w-full h-full object-contain cursor-pointer relative z-0"
        loop
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onClick={handleSingleOrDoubleClick}
      />

      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

      {showHeartAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in duration-200">
          <FaHeart className="text-red-500 text-8xl drop-shadow-2xl animate-bounce" />
        </div>
      )}

      <div
        onClick={handleSingleOrDoubleClick}
        className={`absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 z-10 transition-opacity duration-200 ${
          isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        }`}
      >
        <div className="bg-black/50 backdrop-blur-md rounded-full p-5 border border-white/20 hover:scale-110 transition">
          {isPlaying ? (
            <FiPause size={36} className="text-white" />
          ) : (
            <FiPlay size={36} className="text-white ml-1" />
          )}
        </div>
      </div>

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
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowShare(true);
          }}
          className="flex flex-col items-center gap-1 cursor-pointer group"
          aria-label="Share Reel"
        >
          <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:scale-110 transition">
            <FiSend className="text-white text-2xl" />
          </div>
        </button>

        {/* Download Action */}
        <button
          onClick={handleDownloadReel}
          disabled={isDownloading}
          className="flex flex-col items-center gap-1 cursor-pointer group disabled:opacity-50"
          aria-label="Download Reel"
          title="Download Reel"
        >
          <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:scale-110 transition">
            <FiDownload className={`text-white text-2xl group-hover:text-green-400 ${isDownloading ? "animate-pulse text-green-400" : ""}`} />
          </div>
          <span className="text-[11px] font-semibold drop-shadow">Save</span>
        </button>

        {/* Save Action */}
        <button
          onClick={handleSave}
          className="flex flex-col items-center gap-1 cursor-pointer group"
          aria-label="Save Reel"
        >
          <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:scale-110 transition">
            {isSaved ? (
              <FaBookmark className="text-[#FFD700] text-2xl" />
            ) : (
              <FaRegBookmark className="text-white text-2xl" />
            )}
          </div>
        </button>
      </div>

      <div className="absolute bottom-6 left-4 right-20 z-20 text-white flex flex-col gap-2 text-left">
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
        <div className="flex items-center gap-2 text-[11px] text-pink-300 font-medium pt-0.5">
          <FiMusic size={12} className="text-pink-400 animate-spin duration-3000 flex-shrink-0" />
          <span className="truncate">
            {reel?.music?.title ? `${reel.music.title} • ${reel.music.artist}` : `${authorName} · Original Audio`}
          </span>
          {reel?.music?.title && (
            <div className="flex items-center gap-0.5 ml-0.5 flex-shrink-0">
              <span className="w-0.5 h-2 bg-pink-400 animate-pulse rounded-full" />
              <span className="w-0.5 h-3 bg-pink-400 animate-pulse delay-75 rounded-full" />
              <span className="w-0.5 h-1.5 bg-pink-400 animate-pulse delay-150 rounded-full" />
            </div>
          )}
        </div>
      </div>

      <div
        onClick={handleSeek}
        className="absolute bottom-0 left-0 w-full h-1.5 bg-white/20 hover:h-2.5 transition-all duration-200 cursor-pointer z-30 group"
      >
        <div
          className="h-full bg-white transition-all duration-100 rounded-r-full shadow-md"
          style={{ width: `${videoProgress}%` }}
        />
      </div>
      <CommentsDrawer
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={reel?._id}
        postAuthorId={authorId}
        comments={commentsList}
        onCommentsUpdate={(updated) => setCommentsList(updated)}
        currentUserId={currentUserId}
        currentUser={userData}
      />

      {/* Reel Share Modal */}
      {showShare && (
        <ReelShareModal
          reel={reel}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

export default ReelCard;
