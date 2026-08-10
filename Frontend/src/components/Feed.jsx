import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import dp from "../assets/dp.png";
import logo from "../assets/logo.png";
import StoryCard from "./StoryCard";
import Post from "./Post";
import Nav from "./Nav";
import useGetAllPosts from "../hooks/getAllPost";
import useGetAllReels from "../hooks/getAllReels";
import useGetAllStories from "../hooks/getAllStories";
import { addStory } from "../redux/story.slice";
import { setUserData } from "../redux/userSlice";
import { ClipLoader } from "react-spinners";
import axios from "axios";
import { serverUrl } from "../App.jsx";
import { FaRegHeart } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";

function Feed() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useGetAllPosts();
  useGetAllReels();
  useGetAllStories();

  const { userData } = useSelector((state) => state.user);
  const { posts, loading: postsLoading } = useSelector((state) => state.post);
  const { stories } = useSelector((state) => state.story);

  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const fileInputRef = useRef(null);

  const currentUserId = (userData?._id || userData?.id)?.toString();

  // Find logged in user's active stories
  const myStories = (stories || []).filter((s) => {
    const authorObj = typeof s.author === "object" && s.author !== null ? s.author : null;
    const authorId = (authorObj?._id || authorObj?.id || s.author)?.toString();
    return authorId && currentUserId && authorId === currentUserId;
  });

  const hasUserStory = myStories.length > 0;

  // Group other users' active stories by author ID
  const otherStoriesGrouped = React.useMemo(() => {
    if (!stories || stories.length === 0) return [];

    const map = new Map();
    stories.forEach((s) => {
      const authorObj = typeof s.author === "object" && s.author !== null ? s.author : null;
      const authorId = (authorObj?._id || authorObj?.id || s.author)?.toString();

      if (authorId && authorId !== currentUserId) {
        if (!map.has(authorId)) {
          map.set(authorId, {
            author: authorObj || { _id: authorId, name: "User", username: "user", profileImage: dp },
            storiesList: [],
          });
        }
        map.get(authorId).storiesList.push(s);
      }
    });

    return Array.from(map.values());
  }, [stories, currentUserId]);

  // Check if all stories in a group have been viewed
  const checkIsGroupSeen = React.useCallback(
    (storiesList) => {
      if (!storiesList || storiesList.length === 0) return false;
      const seenStored = JSON.parse(localStorage.getItem("vistagram_seen_stories") || "[]");

      return storiesList.every((s) => {
        if (!s) return false;
        const sId = (s._id || s).toString();
        if (seenStored.includes(sId)) return true;

        if (s.viewers && Array.isArray(s.viewers)) {
          return s.viewers.some((v) => {
            const vId = (typeof v === "object" ? v._id || v.id : v)?.toString();
            return vId === currentUserId;
          });
        }
        return false;
      });
    },
    [currentUserId]
  );

  const isYourStorySeen = checkIsGroupSeen(myStories);

  const handlePlusClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleYourStoryClick = () => {
    if (hasUserStory) {
      navigate("/story", { state: { groupIdx: 0 } });
    } else {
      handlePlusClick();
    }
  };

  const handleOpenOtherUserStory = (gIdx) => {
    navigate("/story", { state: { groupIdx: gIdx + (hasUserStory ? 1 : 0) } });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingStory(true);
    const formData = new FormData();
    formData.append("media", file);
    const isVideo = file.type.startsWith("video/");
    formData.append("mediaType", isVideo ? "video" : "image");

    try {
      const res = await axios.post(`${serverUrl}/api/story/upload`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.story) {
        dispatch(addStory(res.data.story));
        if (userData) {
          dispatch(
            setUserData({
              ...userData,
              story: [...(userData.story || []), res.data.story._id],
            })
          );
        }
      }
    } catch (error) {
      console.error("Error uploading story:", error);
    } finally {
      setIsUploadingStory(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full max-w-2xl min-h-screen bg-black text-white flex flex-col items-center select-none">
      {/* Hidden File Input for Story Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*"
        className="hidden"
      />
      <div className="w-full flex items-center justify-between px-5 py-3 border-b border-gray-900/80 sticky top-0 bg-black/95 backdrop-blur-md z-40 lg:hidden">
        <button
          onClick={() => navigate("/upload")}
          className="text-white hover:text-gray-300 transition cursor-pointer p-1"
          aria-label="Upload Post, Story or Reel"
        >
          <FiPlus size={28} className="stroke-[2.5]" />
        </button>

        <img
          src={logo}
          alt="Vistagram"
          className="h-11 sm:h-12 w-auto max-w-[220px] scale-150 transform object-contain cursor-pointer hover:opacity-80 transition origin-center"
          onClick={() => navigate("/")}
        />

        <button className="text-white hover:text-red-500 transition cursor-pointer p-1">
          <FaRegHeart size={24} />
        </button>
      </div>

      {/* Stories Bar */}
      <div className="flex w-full justify-start overflow-x-auto gap-4 items-center px-5 py-3.5 no-scrollbar border-b border-gray-900/60 bg-black">
        <StoryCard
          isYourStory={true}
          hasStory={hasUserStory}
          isSeen={isYourStorySeen}
          ProfileImage={userData?.profileImage}
          username="Your story"
          onClick={handleYourStoryClick}
          onPlusClick={handlePlusClick}
          loading={isUploadingStory}
        />

        {/* Other Users' Stories Cards */}
        {otherStoriesGrouped.map((userGroup, gIdx) => {
          const isGroupSeen = checkIsGroupSeen(userGroup.storiesList);
          return (
            <StoryCard
              key={userGroup.author?._id || userGroup.author?.username || gIdx}
              isYourStory={false}
              hasStory={true}
              isSeen={isGroupSeen}
              ProfileImage={userGroup.author?.profileImage || dp}
              username={userGroup.author?.username || userGroup.author?.name || "user"}
              onClick={() => handleOpenOtherUserStory(gIdx)}
            />
          );
        })}
      </div>

      {/* Main Feed Posts List*/}
      <div className="w-full min-h-screen flex flex-col items-center gap-4 sm:gap-6 px-0 sm:px-4 pt-2 sm:pt-6 bg-black relative pb-[80px] sm:pb-[120px]">
        {postsLoading && (!posts || posts.length === 0) ? (
          <div className="flex flex-col items-center justify-center my-12 gap-3">
            <ClipLoader size={30} color="#ffffff" />
            <p className="text-xs font-semibold text-gray-400">Loading feed posts...</p>
          </div>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => <Post key={post._id} post={post} />)
        ) : (
          <div className="flex flex-col items-center justify-center my-12 text-center">
            <p className="text-sm font-bold text-gray-300">No posts available yet</p>
            <p className="text-xs text-gray-500 mt-1">Be the first to share a post on Vistagram!</p>
          </div>
        )}

        <Nav />
      </div>
    </div>
  );
}

export default Feed;