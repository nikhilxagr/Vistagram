import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { FiImage, FiSend, FiX } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import axios from "axios";
import { setMessages } from "../redux/message.Slice";
import { serverUrl } from "../App.jsx";
import dp from "../assets/dp.png";
import SenderMessage from "../components/SenderMessage";
import ReceiverMessage from "../components/ReceiverMessage";

function MessageArea() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedUser, messages } = useSelector((state) => state.message);
  const { userData } = useSelector((state) => state.user);

  const [textMessage, setTextMessage] = useState("");
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);

  const currentUserId = (userData?._id || userData?.id)?.toString();
  const targetUserId = (selectedUser?._id || selectedUser?.id)?.toString();

  const username = selectedUser?.username || selectedUser?.userName || "user";
  const name = selectedUser?.name || selectedUser?.fullName || "";
  const profileImage = selectedUser?.profileImage || dp;

  const getAllMessages = async () => {
    if (!targetUserId) return;
    try {
      const res = await axios.get(
        `${serverUrl}/api/messages/getAll/${targetUserId}`,
        { withCredentials: true }
      );
      const msgList = res.data?.data || res.data || [];
      dispatch(setMessages(Array.isArray(msgList) ? msgList : []));
    } catch (err) {
      console.error("Error fetching messages:", err);
      dispatch(setMessages([]));
    }
  };

  useEffect(() => {
    if (selectedUser) {
      getAllMessages();
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!textMessage.trim() && !backendImage) || isSending || !targetUserId) return;

    setIsSending(true);

    const formData = new FormData();
    if (textMessage.trim()) {
      formData.append("message", textMessage.trim());
    }
    if (backendImage) {
      formData.append("image", backendImage);
    }

    const tempText = textMessage;
    setTextMessage("");
    setFrontendImage(null);
    setBackendImage(null);

    try {
      const res = await axios.post(
        `${serverUrl}/api/messages/send/${targetUserId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (res.data?.data) {
        dispatch(setMessages([...(messages || []), res.data.data]));
      } else {
        getAllMessages();
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setTextMessage(tempText);
    } finally {
      setIsSending(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white gap-4 p-4">
        <p className="text-gray-400 text-sm font-semibold">No user selected for messaging.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black flex flex-col justify-between overflow-hidden select-none">
      {/* Top Header */}
      <div className="w-full flex items-center gap-3 px-4 py-3 bg-black border-b border-gray-900 sticky top-0 z-50">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:text-gray-300 p-1 cursor-pointer transition"
          aria-label="Back"
        >
          <MdOutlineKeyboardBackspace size={26} />
        </button>

        <div
          onClick={() => navigate(`/profile/${username}`)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-800 bg-gray-900 flex-shrink-0">
            <img
              src={profileImage}
              alt={username}
              className="w-full h-full object-cover group-hover:scale-105 transition"
            />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-white leading-tight group-hover:underline">
              {username}
            </span>
            {name && (
              <span className="text-xs text-gray-400 font-medium">{name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Optional Selected Image Attachment  */}
      {frontendImage && (
        <div className="w-full h-44 bg-gray-950 border-b border-gray-900 flex items-center justify-center overflow-hidden relative p-2">
          <img
            src={frontendImage}
            alt="Attachment Preview"
            className="w-full h-full object-contain rounded-lg"
          />
          <button
            type="button"
            onClick={() => {
              setFrontendImage(null);
              setBackendImage(null);
            }}
            className="absolute top-3 right-3 bg-black/80 text-white rounded-full p-1.5 hover:bg-black transition cursor-pointer"
            aria-label="Remove image"
          >
            <FiX size={14} />
          </button>
        </div>
      )}

      {/*  Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-black">
        {messages && messages.length > 0 ? (
          messages.map((msg, idx) => {
            const senderId = (msg.sender?._id || msg.sender?.id || msg.sender)?.toString();
            const isMe = currentUserId && senderId && currentUserId === senderId;

            return isMe ? (
              <SenderMessage key={msg._id || idx} message={msg} />
            ) : (
              <ReceiverMessage
                key={msg._id || idx}
                message={msg}
                authorImage={profileImage}
              />
            );
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 py-12 gap-2">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-800 bg-gray-900 mb-2">
              <img src={profileImage} alt={username} className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-bold text-white">{name || username}</span>
            <p className="text-xs text-gray-400">Say hi to start the conversation on Vistagram!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="w-full pb-5 pt-2 px-4 flex justify-center bg-black sticky bottom-0 z-40"
      >
        <div className="w-full max-w-2xl bg-[#121212] border border-gray-800/80 rounded-full flex items-center px-4 py-2 text-white shadow-2xl gap-2 sm:gap-3">
          <input
            type="text"
            value={textMessage}
            onChange={(e) => setTextMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none px-2"
          />

          <label className="cursor-pointer text-gray-400 hover:text-white transition p-1.5 rounded-full hover:bg-gray-800/60 flex items-center justify-center">
            <FiImage size={21} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>

          <button
            type="submit"
            disabled={(!textMessage.trim() && !backendImage) || isSending}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition flex items-center justify-center text-white shadow-md cursor-pointer flex-shrink-0 disabled:opacity-40"
          >
            {isSending ? (
              <ClipLoader size={14} color="#ffffff" />
            ) : (
              <FiSend size={16} className="-rotate-12 ml-0.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MessageArea;