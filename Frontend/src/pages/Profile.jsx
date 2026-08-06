import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setProfileData, clearUserData } from "../redux/userSlice";
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

  const { userData, profileData } = useSelector((state) => state.user);
  const { posts: allPosts } = useSelector((state) => state.post);
  const { reels: allReels } = useSelector((state) => state.reel);

  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [fetchedUser, setFetchedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("POSTS");
  const [selectedMedia, setSelectedMedia] = useState(null);

  const isOwnProfile =
    userData &&
    (userData.username === userName ||
      userData.userName === userName ||
      userData._id === userName);

  const handleProfile = async () => {
    setLoading(true);
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
      console.log("Using fallback profile data");
      const fallback = {
        name: userName,
        username: userName,
        bio: "Vistagram Creator",
        profession: "Creator",
      };
      setFetchedUser(fallback);
      dispatch(setProfileData(fallback));
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
  }, [userName, userData]);

  const displayUser = isOwnProfile ? (userData || fetchedUser) : (fetchedUser || profileData);

  const targetId = displayUser?._id || displayUser?.id;
  const targetUsername = displayUser?.username || displayUser?.userName;

  const userPosts =
    displayUser?.posts && displayUser.posts.length > 0
      ? displayUser.posts
      : allPosts?.filter(
          (p) =>
            p.author?._id === targetId ||
            p.author?.id === targetId ||
            p.author?.username === targetUsername
        ) || [];

  const userSaved = displayUser?.savedPosts || [];

  const userReels =
    displayUser?.reels && displayUser.reels.length > 0
      ? displayUser.reels
      : allReels?.filter(
          (r) =>
            r.author?._id === targetId ||
            r.author?.id === targetId ||
            r.author?.username === targetUsername
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
                {displayUser?.name || "Ayush Sahu"}
              </h2>
              <p className="text-sm text-gray-300 font-medium mb-1">
                {displayUser?.profession || "Youtuber"}
              </p>
              <p className="text-xs text-gray-200 font-semibold tracking-wide uppercase">
                {displayUser?.bio || "MERN DEVELOPER"}
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
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-8 py-2 rounded-full font-semibold text-sm transition shadow cursor-pointer ${
                  isFollowing
                    ? "bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>

              <button className="px-8 py-2 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition shadow cursor-pointer">
                Message
              </button>
            </div>
          )}

          <div className="w-full min-h-[420px] bg-white text-black rounded-t-[40px] mt-8 p-4 md:p-6 flex flex-col items-center justify-start relative shadow-2xl">
            <div className="w-full max-w-md flex items-center justify-around border-b border-gray-200 pb-3 mb-6">
              <button
                onClick={() => setActiveTab("POSTS")}
                className={`flex items-center gap-2 text-xs font-bold tracking-wider cursor-pointer transition pb-1 border-b-2 ${
                  activeTab === "POSTS"
                    ? "text-black border-black"
                    : "text-gray-400 border-transparent hover:text-gray-600"
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
                      ? "text-black border-black"
                      : "text-gray-400 border-transparent hover:text-gray-600"
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
                    ? "text-black border-black"
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                <FiFilm className="text-base" />
                REELS
              </button>
            </div>

            {activeList.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5 md:gap-3 w-full max-w-lg">
                {activeList.map((item, idx) => {
                  const isVideo = item.mediaType === "video" || activeTab === "REELS";
                  return (
                    <div
                      key={item._id || idx}
                      onClick={() => setSelectedMedia(item)}
                      className="aspect-square w-full rounded-xl overflow-hidden bg-gray-900 relative group cursor-pointer border border-gray-100 shadow-sm"
                    >
                      {isVideo ? (
                        <video
                          src={item.media}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={item.media}
                          alt="Media thumbnail"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      )}

                      {isVideo && (
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white p-1 rounded-full">
                          <FiPlay size={12} className="fill-white" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4 text-white font-bold text-xs">
                        <div className="flex items-center gap-1">
                          <FiHeart className="fill-white" />
                          <span>{item.likes?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiMessageCircle className="fill-white" />
                          <span>{item.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center my-16 text-center">
                <div className="p-4 rounded-full bg-gray-100 mb-3 text-gray-400">
                  {activeTab === "POSTS" && <FiGrid size={28} />}
                  {activeTab === "SAVED" && <FiBookmark size={28} />}
                  {activeTab === "REELS" && <FiFilm size={28} />}
                </div>
                <p className="text-sm font-bold text-gray-700">
                  No {activeTab.toLowerCase()} yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
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