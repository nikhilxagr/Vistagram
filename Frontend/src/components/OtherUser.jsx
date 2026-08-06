import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import dp from "../assets/dp.png";

function OtherUser({ user }) {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const targetId = user?._id || user?.id;

  const checkIfFollowing = () => {
    if (!userData?.following || !targetId) return false;
    return userData.following.some(
      (id) => (id._id || id || "").toString() === targetId.toString()
    );
  };

  const [following, setFollowing] = useState(checkIfFollowing());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFollowing(checkIfFollowing());
  }, [userData?.following, targetId]);

  if (!user) return null;

  const handleFollowToggle = async () => {
    if (!targetId || loading) return;
    setLoading(true);
    const nextState = !following;
    setFollowing(nextState);

    try {
      await axios.put(
        `${serverUrl}/api/users/follow/${targetId}`,
        {},
        { withCredentials: true }
      );

      if (userData) {
        let updatedFollowing = [...(userData.following || [])];
        if (nextState) {
          if (!updatedFollowing.some((id) => (id._id || id).toString() === targetId.toString())) {
            updatedFollowing.push(user);
          }
        } else {
          updatedFollowing = updatedFollowing.filter(
            (id) => (id._id || id).toString() !== targetId.toString()
          );
        }
        dispatch(setUserData({ ...userData, following: updatedFollowing }));
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      setFollowing(!nextState);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-between py-2 border-b border-gray-900/60 last:border-none">
      <div className="flex items-center gap-3 overflow-hidden">
        <div
          className="w-11 h-11 rounded-full overflow-hidden border border-gray-800 flex-shrink-0 cursor-pointer"
          onClick={() => navigate(`/profile/${user.username || user.userName}`)}
        >
          <img
            src={user.profileImage || dp}
            alt={user.username}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="overflow-hidden">
          <div
            className="text-sm font-semibold text-white truncate cursor-pointer hover:underline"
            onClick={() => navigate(`/profile/${user.username || user.userName}`)}
          >
            {user.username || user.userName}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {user.name}
          </div>
        </div>
      </div>

      <button
        onClick={handleFollowToggle}
        disabled={loading}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex-shrink-0 disabled:opacity-50 ${
          following
            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
            : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-900/30"
        }`}
      >
        {loading ? "..." : following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

export default OtherUser;
