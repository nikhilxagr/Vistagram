import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setProfileData, clearUserData } from "../redux/userSlice";
import { serverUrl } from "../App.jsx";
import dp from "../assets/dp.png";
import { FiArrowLeft } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import Nav from "../components/Nav";

function Profile() {
  const { userName } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userData, profileData } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [fetchedUser, setFetchedUser] = useState(null);

  const sampleUsersMap = {
    ankush123: { name: "Ankush", username: "ankush123", bio: "MERN DEVELOPER", profession: "Youtuber" },
    theadityasahu__: { name: "Ayush Sahu", username: "theadityasahu__", bio: "MERN DEVELOPER", profession: "Youtuber" },
    sahil_kumar: { name: "Sahil Kumar", username: "sahil_kumar", bio: "FULL STACK DEVELOPER", profession: "Software Engineer" },
    gaurav_dev: { name: "Gaurav Singh", username: "gaurav_dev", bio: "REACT & NODE DEVELOPER", profession: "Full Stack" },
  };

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
      console.log("Using fallback profile for suggested user:", userName);
      const fallback = sampleUsersMap[userName] || {
        name: userName,
        username: userName,
        bio: "MERN DEVELOPER",
        profession: "Youtuber",
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

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col items-center relative">
      {/* Top Header Bar */}
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

        <button
          onClick={handleSignOut}
          className="text-blue-500 font-bold text-sm hover:text-blue-400 transition cursor-pointer"
        >
          Log Out
        </button>
      </header>

      {/* Profile Main Content */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <ClipLoader size={35} color="#ffffff" />
          <p className="text-sm text-gray-400 font-medium">Loading profile...</p>
        </div>
      ) : (
        <div className="w-full max-w-2xl flex flex-col items-center px-4 pt-6 text-center">
          {/* Avatar Profile Picture on Left, Name & Bio on Right (Left-aligned) matching Reference Image */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-gray-800 shadow-2xl bg-gray-900 flex-shrink-0">
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

          {/* Stats: Posts, Followers, Following with Avatar Stack icons matching Reference Image */}
          <div className="w-full max-w-sm flex items-center justify-around py-4 mt-2">
            {/* Posts */}
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">
                {displayUser?.posts?.length || 0}
              </span>
              <span className="text-xs text-gray-400 font-medium mt-1">Posts</span>
            </div>

            {/* Followers */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="w-4 h-4 rounded-full bg-gray-700 border border-black" />
                  <div className="w-4 h-4 rounded-full bg-gray-500 border border-black" />
                </div>
                <span className="text-xl font-bold text-white">
                  {displayUser?.followers?.length || 0}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-medium mt-1">Followers</span>
            </div>

            {/* Following */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="w-4 h-4 rounded-full bg-gray-700 border border-black" />
                  <div className="w-4 h-4 rounded-full bg-gray-500 border border-black" />
                </div>
                <span className="text-xl font-bold text-white">
                  {displayUser?.following?.length || 0}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-medium mt-1">Following</span>
            </div>
          </div>

          {/* Action Buttons */}
          {isOwnProfile ? (
            <button
              onClick={() => navigate("/edit-profile")}
              className="px-8 py-2 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition shadow cursor-pointer mt-2"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-8 py-2 rounded-full font-semibold text-sm transition shadow cursor-pointer ${
                  isFollowing
                    ? "bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700"
                    : "bg-white text-black hover:bg-gray-200"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>

              <button className="px-8 py-2 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition shadow cursor-pointer">
                Message
              </button>
            </div>
          )}

          {/* Bottom White Rounded Container matching Reference Image */}
          <div className="w-full min-h-[380px] bg-white rounded-t-[40px] mt-8 p-6 flex flex-col items-center justify-start text-gray-400 relative pb-28">
            <p className="text-xs font-semibold text-gray-400 mt-6">No posts yet</p>
          </div>
        </div>
      )}

      {/* Floating Bottom Nav */}
      <Nav />
    </div>
  );
}

export default Profile;