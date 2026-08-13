import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import dp from "../assets/dp.png";
import { FiSearch, FiArrowLeft, FiX, FiUserPlus, FiUserCheck } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import { setUserData } from "../redux/userSlice";

function Search() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [followLoading, setFollowLoading] = useState({});
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("vistagram_recent_searches")) || [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);
  const saveRecent = (user) => {
    const updated = [
      user,
      ...recentSearches.filter((u) => (u._id || u.id) !== (user._id || user.id)),
    ].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem("vistagram_recent_searches", JSON.stringify(updated));
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("vistagram_recent_searches");
  };

  const removeRecent = (userId) => {
    const updated = recentSearches.filter((u) => (u._id || u.id) !== userId);
    setRecentSearches(updated);
    localStorage.setItem("vistagram_recent_searches", JSON.stringify(updated));
  };

  // Debounced search API call
  const doSearch = useCallback(async (keyword) => {
    if (!keyword.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await axios.get(
        `${serverUrl}/api/users/search?keyword=${encodeURIComponent(keyword.trim())}`,
        { withCredentials: true }
      );
      setResults(res.data?.users || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleUserClick = (user) => {
    saveRecent(user);
    navigate(`/profile/${user.username || user.userName}`);
  };

  // Follow / Unfollow
  const handleFollow = async (e, user) => {
    e.stopPropagation();
    const userId = user._id || user.id;
    if (!userId || followLoading[userId]) return;

    const isFollowing = userData?.following?.some(
      (f) => (f._id || f)?.toString() === userId.toString()
    );

    setFollowLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await axios.put(
        `${serverUrl}/api/users/follow/${userId}`,
        {},
        { withCredentials: true }
      );

      const currentFollowing = userData?.following || [];
      const updatedFollowing = isFollowing
        ? currentFollowing.filter((f) => (f._id || f)?.toString() !== userId.toString())
        : [...currentFollowing, { _id: userId, username: user.username, profileImage: user.profileImage }];

      dispatch(setUserData({ ...userData, following: updatedFollowing }));
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const isFollowing = (userId) =>
    userData?.following?.some(
      (f) => (f._id || f)?.toString() === userId?.toString()
    );

  const currentUserId = userData?._id || userData?.id;

  // Render a user row
  const UserRow = ({ user, onRemove }) => {
    const uid = user._id || user.id;
    const username = user.username || user.userName || "user";
    const isSelf = uid?.toString() === currentUserId?.toString();
    const following = isFollowing(uid);
    const loading = followLoading[uid];

    return (
      <div
        onClick={() => handleUserClick(user)}
        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-900/60 transition cursor-pointer group"
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-800 bg-gray-900 flex-shrink-0 group-hover:scale-105 transition">
          <img
            src={user.profileImage || dp}
            alt={username}
            className="w-full h-full object-cover"
          />
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{username}</p>
          {user.name && (
            <p className="text-xs text-gray-400 truncate">{user.name}</p>
          )}
          {user.followers?.length > 0 && (
            <p className="text-[10px] text-gray-600 mt-0.5">
              {user.followers.length} follower{user.followers.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isSelf && (
            <button
              onClick={(e) => handleFollow(e, user)}
              disabled={loading}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                following
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30"
              }`}
            >
              {loading ? (
                <ClipLoader size={10} color="#ffffff" />
              ) : following ? (
                <>
                  <FiUserCheck size={11} />
                  Following
                </>
              ) : (
                <>
                  <FiUserPlus size={11} />
                  Follow
                </>
              )}
            </button>
          )}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(uid);
              }}
              className="text-gray-600 hover:text-gray-400 p-1 transition cursor-pointer rounded-full"
            >
              <FiX size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col">

      {/* Top Search Bar */}
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-gray-900">
        <div className="flex items-center gap-3 px-4 py-3">

          <button
            onClick={() => navigate(-1)}
            className="flex-shrink-0 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-900 transition cursor-pointer"
          >
            <FiArrowLeft size={20} />
          </button>

          {/* Search Input */}
          <div className="flex-1 flex items-center gap-2.5 bg-gray-900 border border-gray-800 focus-within:border-gray-600 rounded-xl px-3.5 py-2.5 transition">
            <FiSearch size={16} className="text-gray-500 flex-shrink-0" />
            <input
              ref={inputRef}
              id="search-input"
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search users..."
              autoComplete="off"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
            {query && (
              <button
                onClick={handleClear}
                className="text-gray-500 hover:text-gray-300 transition cursor-pointer flex-shrink-0"
              >
                <FiX size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">

        {loading && (
          <div className="flex justify-center items-center py-10">
            <ClipLoader size={24} color="#6366f1" />
          </div>
        )}

        {/* Search Results */}
        {!loading && searched && (
          <>
            {results.length > 0 ? (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-5 pt-4 pb-2">
                  Results
                </p>
                {results.map((user) => (
                  <UserRow key={user._id || user.id} user={user} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
                  <FiSearch size={28} className="text-gray-600" />
                </div>
                <p className="text-sm font-bold text-white">No results for "{query}"</p>
                <p className="text-xs text-gray-500 mt-1">Try searching for a different name or username</p>
              </div>
            )}
          </>
        )}

        {/* Recent Searches */}
        {!loading && !searched && recentSearches.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <p className="text-sm font-bold text-white">Recent</p>
              <button
                onClick={clearRecent}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
              >
                Clear all
              </button>
            </div>
            {recentSearches.map((user) => (
              <UserRow
                key={user._id || user.id}
                user={user}
                onRemove={removeRecent}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !searched && recentSearches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-5">
              <FiSearch size={34} className="text-gray-700" />
            </div>
            <h2 className="text-base font-bold text-white mb-1">Search Vistagram</h2>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
              Find people to follow, discover creators, and connect with your community.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
