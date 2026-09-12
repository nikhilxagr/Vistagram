import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { FiImage, FiSend, FiX, FiMic, FiTrash2 } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import axios from "axios";
import { setMessages, updateMessageReaction } from "../redux/message.Slice";
import { serverUrl } from "../App.jsx";
import dp from "../assets/dp.png";
import SenderMessage from "../components/SenderMessage";
import ReceiverMessage from "../components/ReceiverMessage";

function MessageArea() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedUser, messages } = useSelector((state) => state.message);
  const { userData } = useSelector((state) => state.user);
  const socket = useSelector((state) => state.socket?.socket);
  const onlineUsers = useSelector((state) => state.socket?.onlineUsers || []);

  const [textMessage, setTextMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioStreamRef = useRef(null);

  const currentUserId = (userData?._id || userData?.id)?.toString();
  const targetUserId = (selectedUser?._id || selectedUser?.id)?.toString();

  const isOnline = Boolean(targetUserId && onlineUsers.includes(targetUserId));

  const username = selectedUser?.username || selectedUser?.userName || "user";
  const name = selectedUser?.name || selectedUser?.fullName || "";
  const profileImage = selectedUser?.profileImage || dp;

  // Fetch conversation messages
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

  // Real-time socket listener for incoming new messages & reactions
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (newMsg) => {
      const msgSenderId = (newMsg.sender?._id || newMsg.sender?.id || newMsg.sender)?.toString();
      if (msgSenderId === targetUserId) {
        dispatch(setMessages([...(messages || []), newMsg]));
      }
    };

    const handleMessageReaction = (payload) => {
      dispatch(updateMessageReaction(payload));
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageReaction", handleMessageReaction);
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageReaction", handleMessageReaction);
    };
  }, [socket, messages, targetUserId, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getReplySnapshot = () => {
    if (!replyingTo) return null;
    const isMyself =
      (replyingTo.sender?._id || replyingTo.sender?.id || replyingTo.sender)?.toString() === currentUserId;
    return {
      messageId: replyingTo._id,
      text: replyingTo.messages || replyingTo.message || "",
      senderName: isMyself ? "You" : username || "User",
      messageType: replyingTo.audio
        ? "audio"
        : replyingTo.image
        ? "image"
        : "text",
      image: replyingTo.image || null,
    };
  };

  const handleReactToMessage = async (messageId, emoji) => {
    if (!messageId || !emoji) return;

    // Optimistic local update
    const targetMsg = messages?.find(
      (m) => (m._id || m.id)?.toString() === messageId.toString()
    );
    if (targetMsg) {
      const existingReactions = Array.isArray(targetMsg.reactions)
        ? [...targetMsg.reactions]
        : [];
      const userIdx = existingReactions.findIndex(
        (r) => r.user?.toString() === currentUserId
      );
      if (userIdx > -1) {
        if (existingReactions[userIdx].emoji === emoji) {
          existingReactions.splice(userIdx, 1);
        } else {
          existingReactions[userIdx] = { user: currentUserId, emoji };
        }
      } else {
        existingReactions.push({ user: currentUserId, emoji });
      }
      dispatch(
        updateMessageReaction({ messageId, reactions: existingReactions })
      );
    }

    try {
      await axios.put(
        `${serverUrl}/api/messages/react/${messageId}`,
        { emoji },
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Error reacting to message:", err);
    }
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
    inputRef.current?.focus();
  };

  const handleScrollToMessage = (messageId) => {
    if (!messageId) return;
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-indigo-500/20", "rounded-2xl", "transition-colors", "duration-500");
      setTimeout(() => {
        el.classList.remove("bg-indigo-500/20", "rounded-2xl");
      }, 1200);
    }
  };

  // Direct image send without preview
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !targetUserId || isSending) return;

    // Reset input value so same image can be sent again
    e.target.value = "";

    setIsSending(true);

    const formData = new FormData();
    formData.append("image", file);

    const replySnapshot = getReplySnapshot();
    if (replySnapshot) {
      formData.append("replyTo", JSON.stringify(replySnapshot));
      setReplyingTo(null);
    }

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
      console.error("Error sending image:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!textMessage.trim() || isSending || !targetUserId) return;

    setIsSending(true);

    const formData = new FormData();
    formData.append("message", textMessage.trim());

    const replySnapshot = getReplySnapshot();
    if (replySnapshot) {
      formData.append("replyTo", JSON.stringify(replySnapshot));
      setReplyingTo(null);
    }

    const tempText = textMessage;
    setTextMessage("");

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

  // Cleanup audio stream tracks & interval on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    if (isSending || isRecording || !targetUserId) return;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Audio recording is not supported on this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (!MediaRecorder.isTypeSupported("audio/webm")) {
          if (MediaRecorder.isTypeSupported("audio/mp4")) {
            mimeType = "audio/mp4";
          } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
            mimeType = "audio/ogg";
          } else {
            mimeType = "";
          }
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(200);
      mediaRecorderRef.current = mediaRecorder;

      setIsRecording(true);
      setRecordDuration(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone permission was denied. Please allow microphone access to record voice notes.");
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      mediaRecorderRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordDuration(0);
  };

  const sendVoiceNote = async () => {
    if (!mediaRecorderRef.current || isSending || !targetUserId) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const duration = recordDuration;
    const recorder = mediaRecorderRef.current;

    setIsSending(true);
    setIsRecording(false);

    recorder.onstop = async () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }

      const mimeType = recorder.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = [];

      if (audioBlob.size === 0) {
        setIsSending(false);
        setRecordDuration(0);
        return;
      }

      const fileExt = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
      const audioFile = new File([audioBlob], `voice_note_${Date.now()}.${fileExt}`, {
        type: mimeType,
      });

      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("audioDuration", Math.max(1, duration));

      const replySnapshot = getReplySnapshot();
      if (replySnapshot) {
        formData.append("replyTo", JSON.stringify(replySnapshot));
        setReplyingTo(null);
      }

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
        console.error("Error sending voice note:", err);
      } finally {
        setIsSending(false);
        setRecordDuration(0);
      }
    };

    try {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    } catch (err) {
      console.error("Error stopping recorder:", err);
      cancelRecording();
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
          className="text-white hover:text-gray-300 p-1 cursor-pointer transition lg:hidden"
          aria-label="Back"
        >
          <MdOutlineKeyboardBackspace size={26} />
        </button>

        <div
          onClick={() => navigate(`/profile/${username}`)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-800 bg-gray-900 flex-shrink-0">
              <img
                src={profileImage}
                alt={username}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
            </div>
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full shadow-md" />
            )}
          </div>

          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-white leading-tight group-hover:underline">
              {username}
            </span>
            <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-400 font-semibold">Active now</span>
                </>
              ) : (
                name || "Offline"
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-black">
        {messages && messages.length > 0 ? (
          messages.map((msg, idx) => {
            const senderId = (msg.sender?._id || msg.sender?.id || msg.sender)?.toString();
            const isMe = currentUserId && senderId && currentUserId === senderId;

            return isMe ? (
              <SenderMessage
                key={msg._id || idx}
                message={msg}
                onReact={handleReactToMessage}
                onReply={handleReply}
                onScrollToMessage={handleScrollToMessage}
              />
            ) : (
              <ReceiverMessage
                key={msg._id || idx}
                message={msg}
                authorImage={profileImage}
                onReact={handleReactToMessage}
                onReply={handleReply}
                onScrollToMessage={handleScrollToMessage}
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

      <div className="w-full pb-5 pt-2 px-4 flex flex-col items-center bg-black sticky bottom-0 z-40">
        {/* Active Reply Banner */}
        {replyingTo && (
          <div className="w-full max-w-2xl mb-2 bg-[#18181b]/95 backdrop-blur-md border border-gray-800 rounded-2xl px-4 py-2 flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-bottom-2 select-none">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full flex-shrink-0" />
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-[11px] font-bold text-purple-400">
                  Replying to{" "}
                  {((replyingTo.sender?._id || replyingTo.sender?.id || replyingTo.sender)?.toString() === currentUserId)
                    ? "yourself"
                    : `@${username}`}
                </span>
                <span className="text-xs text-gray-300 truncate max-w-xs sm:max-w-md">
                  {replyingTo.audio
                    ? "🎤 Voice message"
                    : replyingTo.image
                    ? "📷 Photo"
                    : replyingTo.messages || replyingTo.message || "Message"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer flex-shrink-0"
              title="Cancel reply"
            >
              <FiX size={16} />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSendMessage}
          className="w-full flex justify-center"
        >
          {isRecording ? (
            <div className="w-full max-w-2xl bg-gradient-to-r from-gray-950 via-[#18181b] to-gray-950 border border-red-500/40 rounded-full flex items-center justify-between px-4 py-2 text-white shadow-[0_0_25px_rgba(239,68,68,0.15)] gap-3">
              {/* Live recording indicator & timer */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                <span className="text-xs font-mono font-bold text-red-400">
                  {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, "0")}
                </span>
              </div>

              {/* Sound wave equalizer animation */}
              <div className="flex-1 flex items-center justify-center gap-[3px] h-6 px-2 overflow-hidden">
                {[35, 65, 90, 50, 80, 40, 100, 75, 45, 85, 60, 95, 50, 70, 40, 85, 60, 100].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      height: `${h}%`,
                      animationDuration: `${0.6 + (i % 4) * 0.2}s`,
                    }}
                    className="w-1 bg-gradient-to-t from-red-500 to-pink-400 rounded-full animate-pulse"
                  />
                ))}
              </div>

              {/* Discard / Cancel Button */}
              <button
                type="button"
                onClick={cancelRecording}
                className="w-9 h-9 rounded-full bg-gray-800/80 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition flex items-center justify-center cursor-pointer flex-shrink-0"
                title="Discard voice note"
                aria-label="Discard voice note"
              >
                <FiTrash2 size={16} />
              </button>

              {/* Send Voice Note Button */}
              <button
                type="button"
                onClick={sendVoiceNote}
                disabled={isSending}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition flex items-center justify-center text-white shadow-md cursor-pointer flex-shrink-0 disabled:opacity-40"
                title="Send voice note"
                aria-label="Send voice note"
              >
                {isSending ? (
                  <ClipLoader size={14} color="#ffffff" />
                ) : (
                  <FiSend size={16} className="-rotate-12 ml-0.5" />
                )}
              </button>
            </div>
          ) : (
            <div className="w-full max-w-2xl bg-[#121212] border border-gray-800/80 rounded-full flex items-center px-4 py-2 text-white shadow-2xl gap-2 sm:gap-3">
              <input
                ref={inputRef}
                type="text"
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none px-2"
              />

              <label className="cursor-pointer text-gray-400 hover:text-white transition p-1.5 rounded-full hover:bg-gray-800/60 flex items-center justify-center">
                {isSending ? (
                  <ClipLoader size={18} color="#a855f7" />
                ) : (
                  <FiImage size={21} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isSending}
                  onChange={handleImageChange}
                />
              </label>

              {textMessage.trim() ? (
                <button
                  type="submit"
                  disabled={!textMessage.trim() || isSending}
                  className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition flex items-center justify-center text-white shadow-md cursor-pointer flex-shrink-0 disabled:opacity-40"
                  title="Send message"
                >
                  {isSending && textMessage.trim() ? (
                    <ClipLoader size={14} color="#ffffff" />
                  ) : (
                    <FiSend size={16} className="-rotate-12 ml-0.5" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isSending}
                  className="w-9 h-9 rounded-full bg-gray-800/90 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-500 text-gray-300 hover:text-white transition flex items-center justify-center shadow-md cursor-pointer flex-shrink-0"
                  title="Record voice note"
                  aria-label="Record voice note"
                >
                  <FiMic size={18} />
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default MessageArea;