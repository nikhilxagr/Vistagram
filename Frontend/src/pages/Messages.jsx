import React, { useEffect, useState, useMemo } from "react";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { setSelectedUser } from "../redux/message.Slice";
import { serverUrl } from "../App";
import dp from "../assets/dp.png";
import { ClipLoader } from "react-spinners";
import OnlineUser from "../components/OnlineUser";

function Messages() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { onlineUsers } = useSelector((state) => state.socket);
  const { suggestedUsers } = useSelector((state) => state.user);

  const [chatUsers, setChatUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPreviousChats = async () => {
    try {
      setLoading(true);
      const res = await axios.put(
        `${serverUrl}/api/messages/prevChats`,
        {},
        { withCredentials: true }
      );
      const usersList = res.data?.data || res.data || [];
      setChatUsers(Array.isArray(usersList) ? usersList : []);
    } catch (err) {
      console.error("Error fetching previous chats:", err);
      setChatUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreviousChats();
  }, []);

  const handleOpenChat = (user) => {
    dispatch(setSelectedUser(user));
    navigate("/messageArea");
  };

  const allAvailableUsers = useMemo(() => {
    const map = new Map();
    [...chatUsers, ...(suggestedUsers || [])].forEach((u) => {
      const id = (u._id || u.id)?.toString();
      if (id && !map.has(id)) {
        map.set(id, u);
      }
    });
    return Array.from(map.values());
  }, [chatUsers, suggestedUsers]);

  const activeOnlineUsersList = useMemo(() => {
    return allAvailableUsers.filter((user) => {
      const uId = (user._id || user.id)?.toString();
      return onlineUsers?.includes(uId);
    });
  }, [allAvailableUsers, onlineUsers]);

  return (
    <div className="w-full min-h-screen flex flex-col bg-black text-white p-4 max-w-2xl mx-auto select-none">
      {/* Header */}
      <div className="w-full h-16 flex items-center gap-4 px-2 border-b border-gray-900 sticky top-0 bg-black z-40">
        <MdOutlineKeyboardBackspace
          className="text-white cursor-pointer w-7 h-7 hover:text-gray-300 transition lg:hidden"
          onClick={() => navigate("/")}
        />
        <h1 className="text-white text-lg font-bold">Messages</h1>
      </div>

      {/* Active Online Users Horizontal Scroll Tray */}
      {activeOnlineUsersList.length > 0 && (
        <div className="w-full flex flex-col gap-2 py-3 border-b border-gray-900">
          <span className="text-xs font-bold text-gray-400 px-1">Active Now</span>
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {activeOnlineUsersList.map((u, idx) => (
              <OnlineUser key={u._id || idx} user={u} />
            ))}
          </div>
        </div>
      )}

      {/* User Chats List */}
      <div className="w-full flex-1 flex flex-col gap-2 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ClipLoader size={30} color="#ffffff" />
            <p className="text-xs text-gray-500 font-semibold">Loading messages...</p>
          </div>
        ) : chatUsers.length > 0 ? (
          chatUsers.map((user, idx) => {
            const userId = (user._id || user.id)?.toString();
            const isOnline = onlineUsers?.includes(userId);
            const username = user.username || user.userName || "User";
            const name = user.name || "";

            return (
              <div
                key={user._id || idx}
                onClick={() => handleOpenChat(user)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-950 hover:bg-gray-900 border border-gray-900/80 transition cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-800 bg-gray-900 flex-shrink-0">
                      <img
                        src={user.profileImage || dp}
                        alt={username}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full shadow-md" />
                    )}
                  </div>

                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-sm font-bold text-white group-hover:underline truncate">
                      {username}
                    </span>
                    <span className="text-xs text-gray-400 font-medium truncate">
                      {isOnline ? (
                        <span className="text-green-400 font-semibold">Active now</span>
                      ) : (
                        name || "Tap to message"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-2 text-center">
            <p className="text-sm font-bold text-gray-400">No users found</p>
            <p className="text-xs text-gray-500 max-w-xs">
              Visit a user's profile and tap Message to start chatting on Vistagram!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;