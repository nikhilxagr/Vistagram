import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setProfileData, clearUserData, setUserData } from "../redux/userSlice";
import { serverUrl } from "../App.jsx";
import dp from "../assets/dp.png";
import { FiArrowLeft, FiGrid, FiBookmark, FiFilm, FiPlay, FiHeart, FiMessageCircle, FiX } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import Nav from "../components/Nav";
import Post from "../components/Post";
import useGetAllPosts from "../hooks/getAllPost";
import useGetAllReels from "../hooks/getAllReels";

function Profile() {
  const { userName } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useGetAllPosts();
  useGetAllReels();

  const { userData } = useSelector((state) => state.user);
  const { posts: allPosts } = useSelector((state) => state.post);
  const { reels: allReels } = useSelector((state) => state.reel);

  const [loading, setLoading] = useState(true);
  const [fetchedUser, setFetchedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("POSTS");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile =
    userData &&
    (userName === "user" ||
      userData.username === userName ||
      userData.userName === userName ||
      userData._id === userName);

  useEffect(() => {
    if (userName === "user" && (userData?.username || userData?.userName)) {
      const realUname = userData.username || userData.userName;
      navigate(`/profile/${realUname}`, { replace: true });
    }
  }, [userName, userData, navigate]);

  const handleProfile = async () => {
    setLoading(true);
    setFetchedUser(null);

    if (isOwnProfile && userData) {
      setFetchedUser(userData);
      dispatch(setProfileData(userData));
      setLoading(false);
      return;
    }

    try {
      const result = await axios.get(
        `${serverUrl}/api/users/getProfile/${userName}`,
        { withCredentials: true }
      );
      const uData = result.data?.user || result.data;
      setFetchedUser(uData);
      dispatch(setProfileData(uData));
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await axios.post(
        `${serverUrl}/api/auth/signout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      dispatch(clearUserData());
      navigate("/signin");
    }
  };

  useEffect(() => {
    if (userName) {
      handleProfile();
    }
  }, [userName, userData?._id]);

  const displayUser = isOwnProfile ? (userData || fetchedUser) : fetchedUser;
  const targetId = displayUser?._id || displayUser?.id;

  const isFollowingTarget = Boolean(
    userData?.following?.some((id) => (id._id || id || "").toString() === targetId?.toString())
  );

  const handleFollowToggle = async () => {
    if (!targetId || isOwnProfile || followLoading) return;
    setFollowLoading(true);
    const nextFollowingState = !isFollowingTarget;

    try {
      await axios.put(
        `${serverUrl}/api/users/follow/${targetId}`,
        {},
        { withCredentials: true }
      );

      if (userData) {
        let updatedFollowing = [...(userData.following || [])];
        if (nextFollowingState) {
          if (!updatedFollowing.some((id) => (id._id || id).toString() === targetId.toString())) {
            updatedFollowing.push(displayUser);
          }
        } else {
          updatedFollowing = updatedFollowing.filter(
            (id) => (id._id || id).toString() !== targetId.toString()
          );
        }
        dispatch(setUserData({ ...userData, following: updatedFollowing }));
      }

      if (fetchedUser) {
        let updatedFollowers = [...(fetchedUser.followers || [])];
        if (nextFollowingState) {
          if (!updatedFollowers.some((id) => (id._id || id).toString() === userData._id.toString())) {
            updatedFollowers.push(userData);
          }
        } else {
          updatedFollowers = updatedFollowers.filter(
            (id) => (id._id || id).toString() !== userData._id.toString()
          );
        }
        setFetchedUser({ ...fetchedUser, followers: updatedFollowers });
      }
    } catch (err) {
      console.error("Error following user from profile:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const targetUsername = displayUser?.username || displayUser?.userName;

  const userPosts =
    displayUser?.posts &&
    displayUser.posts.length > 0 &&
    typeof displayUser.posts[0] === "object" &&
    (displayUser.posts[0]?.media || displayUser.posts[0]?.mediaUrl)
      ? displayUser.posts
      : allPosts?.filter(
          (p) =>
            (p.author?._id || p.author?.id || p.author)?.toString() === targetId?.toString() ||
            p.author?.username === targetUsername ||
            (displayUser?.posts &&
              displayUser.posts.some((id) => (id._id || id).toString() === (p._id || p).toString()))
        ) || [];

  const userSaved =
    displayUser?.savedPosts &&
    displayUser.savedPosts.length > 0 &&
    typeof displayUser.savedPosts[0] === "object" &&
    (displayUser.savedPosts[0]?.media || displayUser.savedPosts[0]?.mediaUrl)
      ? displayUser.savedPosts
      : allPosts?.filter((p) =>
          userData?.savedPosts?.some((sp) => (sp._id || sp).toString() === (p._id || p).toString())
        ) || [];

  const userReels =
    displayUser?.reels &&
    displayUser.reels.length > 0 &&
    typeof displayUser.reels[0] === "object" &&
    (displayUser.reels[0]?.media || displayUser.reels[0]?.mediaUrl)
      ? displayUser.reels
      : allReels?.filter(
          (r) =>
            (r.author?._id || r.author?.id || r.author)?.toString() === targetId?.toString() ||
            r.author?.username === targetUsername ||
            (displayUser?.reels &&
              displayUser.reels.some((id) => (id._id || id).toString() === (r._id || r).toString()))
        ) || [];

  const getActiveList = () => {
    if (activeTab === "POSTS") return userPosts;
    if (activeTab === "SAVED") return userSaved;
    if (activeTab === "REELS") return userReels;
    return [];
  };

  const activeList = getActiveList();

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col items-center relative pb-28">
      <header className="w-full max-w-2xl flex items-center justify-between px-6 py-4 sticky top-0 bg-black/90 backdrop-blur-md z-50">
        <button
          onClick={() => navigate(-1)}
          className="text-white text-xl hover:opacity-80 transition cursor-pointer p-1"
          aria-label="Go Back"
        >
          <FiArrowLeft />
        </button>

        <h1 className="text-base md:text-lg font-bold text-white tracking-wide truncate max-w-[200px]">
          {displayUser?.username || displayUser?.userName || userName}
        </h1>

        {isOwnProfile ? (
          <button
            onClick={handleSignOut}
            className="text-blue-500 font-bold text-sm hover:text-blue-400 transition cursor-pointer"
          >
            Log Out
          </button>
        ) : (
          <div className="w-8" />
        )}
      </header>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <ClipLoader size={35} color="#ffffff" />
          <p className="text-sm text-gray-400 font-medium">Loading profile...</p>
        </div>
      ) : (
        <div className="w-full max-w-2xl flex flex-col items-center px-4 pt-6 text-center">
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-gray-800 shadow-2xl bg-gray-900 flex-shrink-0">
              <img
                src={displayUser?.profileImage || dp}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col text-left justify-center">
              <h2 className="text-xl md:text-2xl font-bold text-white leading-tight mb-1">
                {displayUser?.name || displayUser?.username || userName}
              </h2>
              <p className="text-sm text-gray-300 font-medium mb-1">
                {displayUser?.profession || "Creator"}
              </p>
              <p className="text-xs text-gray-200 font-semibold tracking-wide uppercase">
                {displayUser?.bio || "VISTAGRAM CREATOR"}
              </p>
            </div>
          </div>

          <div className="w-full max-w-sm flex items-center justify-around py-4 mt-2 border-y border-gray-900/50">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">
                {userPosts.length}
              </span>
              <span className="text-xs text-gray-400 font-medium mt-1">Posts</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">
                {displayUser?.followers?.length || 0}
              </span>
              <span className="text-xs text-gray-400 font-medium mt-1">Followers</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">
                {displayUser?.following?.length || 0}
              </span>
              <span className="text-xs text-gray-400 font-medium mt-1">Following</span>
            </div>
          </div>

          {isOwnProfile ? (
            <button
              onClick={() => navigate("/edit-profile")}
              className="px-8 py-2 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition shadow cursor-pointer mt-4"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`px-8 py-2 rounded-full font-semibold text-sm transition shadow cursor-pointer disabled:opacity-50 ${
                  isFollowingTarget
                    ? "bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {followLoading ? "..." : isFollowingTarget ? "Following" : "Follow"}
              </button>

              <button className="px-8 py-2 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition shadow cursor-pointer">
                Message
              </button>
            </div>
          )}

          {/* Posts & Reels Grid Container - Dark Theme */}
          <div className="w-full min-h-[420px] bg-black text-white rounded-t-[40px] mt-8 p-4 md:p-6 flex flex-col items-center justify-start relative shadow-2xl border-t border-gray-900">
            <div className="w-full max-w-md flex items-center justify-around border-b border-gray-800 pb-3 mb-6">
              <button
                onClick={() => setActiveTab("POSTS")}
                className={`flex items-center gap-2 text-xs font-bold tracking-wider cursor-pointer transition pb-1 border-b-2 ${
                  activeTab === "POSTS"
                    ? "text-white border-white"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                <FiGrid className="text-base" />
                POSTS
              </button>

              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab("SAVED")}
                  className={`flex items-center gap-2 text-xs font-bold tracking-wider cursor-pointer transition pb-1 border-b-2 ${
                    activeTab === "SAVED"
                      ? "text-white border-white"
                      : "text-gray-500 border-transparent hover:text-gray-300"
                  }`}
                >
                  <FiBookmark className="text-base" />
                  SAVED
                </button>
              )}

              <button
                onClick={() => setActiveTab("REELS")}
                className={`flex items-center gap-2 text-xs font-bold tracking-wider cursor-pointer transition pb-1 border-b-2 ${
                  activeTab === "REELS"
                    ? "text-white border-white"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                <FiFilm className="text-base" />
                REELS
              </button>
            </div>

            {activeList.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5 md:gap-3 w-full max-w-lg">
                {activeList.map((rawItem, idx) => {
                  const item =
                    typeof rawItem === "object" && rawItem !== null && (rawItem.media || rawItem.mediaUrl)
                      ? rawItem
                      : allPosts?.find(
                          (p) => (p._id || p).toString() === (rawItem._id || rawItem).toString()
                        ) ||
                        allReels?.find(
                          (r) => (r._id || r).toString() === (rawItem._id || rawItem).toString()
                        ) ||
                        rawItem;

                  const mediaSrc =
                    item?.media ||
                    item?.mediaUrl ||
                    item?.url ||
                    item?.image ||
                    item?.video ||
                    (typeof rawItem === "string" ? rawItem : null);

                  const isVideo =
                    item?.mediaType === "video" ||
                    activeTab === "REELS" ||
                    (typeof mediaSrc === "string" &&
                      (mediaSrc.includes("/video/upload/") ||
                        mediaSrc.endsWith(".mp4") ||
                        mediaSrc.endsWith(".webm") ||
                        mediaSrc.startsWith("data:video/")));

                  return (
                    <div
                      key={item?._id || idx}
                      onClick={() => setSelectedMedia(item)}
                      className="aspect-square w-full rounded-xl overflow-hidden bg-gray-900 relative group cursor-pointer border border-gray-800 shadow-sm"
                    >
                      {mediaSrc ? (
                        isVideo ? (
                          <video
                            src={mediaSrc}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={mediaSrc}
                            alt="Media thumbnail"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            onError={(e) => {
                              e.target.onerror = null;
                            }}
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-600 text-xs">
                          Media
                        </div>
                      )}

                      {isVideo && (
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white p-1 rounded-full">
                          <FiPlay size={12} className="fill-white" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4 text-white font-bold text-xs">
                        <div className="flex items-center gap-1">
                          <FiHeart className="fill-white" />
                          <span>{item?.likes?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiMessageCircle className="fill-white" />
                          <span>{item?.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center my-16 text-center">
                <div className="p-4 rounded-full bg-gray-900 border border-gray-800 mb-3 text-gray-400">
                  {activeTab === "POSTS" && <FiGrid size={28} />}
                  {activeTab === "SAVED" && <FiBookmark size={28} />}
                  {activeTab === "REELS" && <FiFilm size={28} />}
                </div>
                <p className="text-sm font-bold text-gray-300">
                  No {activeTab.toLowerCase()} yet
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activeTab === "POSTS"
                    ? "Posts uploaded will appear here"
                    : activeTab === "SAVED"
                    ? "Saved posts will appear here"
                    : "Reels shared will appear here"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition cursor-pointer p-1"
            >
              <FiX size={24} />
            </button>
            <Post post={selectedMedia} />
          </div>
        </div>
      )}

      <Nav />
    </div>
  );
}

export default Profile;