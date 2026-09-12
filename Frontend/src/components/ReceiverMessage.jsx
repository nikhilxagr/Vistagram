import React, { useState, useRef } from "react";
import { FiSmile, FiCornerUpLeft } from "react-icons/fi";
import dp from "../assets/dp.png";
import ReelMessageCard from "./ReelMessageCard";
import VoiceNotePlayer from "./VoiceNotePlayer";
import ReactionPicker from "./ReactionPicker";

function parseReelShare(text) {
  if (!text || !text.includes('"type":"reel_share"')) return null;
  try {
    const data = JSON.parse(text);
    return data?.type === "reel_share" ? data : null;
  } catch {
    return null;
  }
}

function ReceiverMessage({ message, authorImage, onReact, onReply, onScrollToMessage }) {
  const [showPicker, setShowPicker] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const lastTapRef = useRef(0);
  const touchStartXRef = useRef(0);

  const timeString = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const textContent = message.messages || message.message;
  const reelData = parseReelShare(textContent);

  const handleBubbleClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      if (onReact) {
        onReact(message._id, "❤️");
        setShowHeartAnim(true);
        setTimeout(() => setShowHeartAnim(false), 750);
      }
    }
    lastTapRef.current = now;
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    const diff = e.touches[0].clientX - touchStartXRef.current;
    if (diff > 0 && diff < 85) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 45 && onReply) {
      onReply(message);
    }
    setSwipeOffset(0);
  };

  return (
    <div
      id={`msg-${message._id}`}
      className="flex items-start gap-2.5 my-1 self-start w-full group relative select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe Reply Arrow Indicator */}
      {swipeOffset > 15 && (
        <div
          style={{ opacity: Math.min(1, swipeOffset / 45) }}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gray-800 text-indigo-400 flex items-center justify-center shadow-md transition-opacity z-20"
        >
          <FiCornerUpLeft size={16} />
        </div>
      )}

      {/* Avatar */}
      <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-800 bg-gray-900 flex-shrink-0 mt-0.5">
        <img
          src={authorImage || dp}
          alt="Sender Avatar"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Message & Action Bar Container */}
      <div
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className="flex items-center gap-1.5 max-w-[85%] sm:max-w-[70%] transition-transform duration-75 relative"
      >
        {/* Reaction Picker Popup */}
        {showPicker && (
          <ReactionPicker
            isSender={false}
            onSelectEmoji={(emoji) => {
              if (onReact) onReact(message._id, emoji);
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        )}

        {/* Message Bubble Body */}
        <div
          onClick={handleBubbleClick}
          className="flex flex-col items-start relative cursor-pointer"
        >
          {/* Heart double-tap animation */}
          {showHeartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <span className="text-3xl animate-ping opacity-90 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]">
                ❤️
              </span>
            </div>
          )}

          {/* Quoted Message Preview if replying */}
          {message.replyTo && (message.replyTo.text || message.replyTo.image || message.replyTo.audio || message.replyTo.messageType) && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onScrollToMessage) onScrollToMessage(message.replyTo.messageId);
              }}
              className="w-full bg-black/40 hover:bg-black/60 border-l-2 border-purple-400 rounded-lg px-2.5 py-1 mb-1 text-left cursor-pointer transition flex flex-col gap-0.5"
            >
              <span className="text-[10px] font-bold text-purple-300 truncate">
                {message.replyTo.senderName || "Replying"}
              </span>
              <span className="text-xs text-gray-300 truncate max-w-[220px]">
                {message.replyTo.messageType === "audio"
                  ? "🎤 Voice message"
                  : message.replyTo.messageType === "image"
                  ? "📷 Photo"
                  : message.replyTo.text || "Message"}
              </span>
            </div>
          )}

          {/* Reel Share Card */}
          {reelData ? (
            <ReelMessageCard data={reelData} />
          ) : (
            <>
              {message.image && (
                <div className="rounded-2xl overflow-hidden mb-1 border border-gray-800 max-w-[260px] max-h-[260px] shadow-lg">
                  <img
                    src={message.image}
                    alt="Received attachment"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {message.audio && (
                <div className="bg-[#262626] text-white rounded-2xl rounded-tl-xs px-3.5 py-2 text-xs font-medium shadow-md border border-gray-800/90 mb-1">
                  <VoiceNotePlayer
                    audioUrl={message.audio}
                    duration={message.audioDuration}
                    isSender={false}
                  />
                </div>
              )}

              {textContent && (
                <div className="bg-[#262626] text-white rounded-2xl rounded-tl-xs px-4 py-2.5 text-xs sm:text-sm font-medium leading-relaxed shadow-md border border-gray-800/90 break-words text-left">
                  {textContent}
                </div>
              )}
            </>
          )}

          {/* Reaction Badge at bottom left of bubble */}
          {message.reactions && message.reactions.length > 0 && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowPicker((prev) => !prev);
              }}
              className="absolute -bottom-2.5 left-1.5 z-10 flex items-center gap-0.5 bg-[#18181b]/95 border border-gray-700/80 rounded-full px-1.5 py-0.5 shadow-md text-xs cursor-pointer hover:scale-105 transition"
              title="Reactions (tap to change)"
            >
              {Array.from(new Set(message.reactions.map((r) => r.emoji))).slice(0, 3).map((em, idx) => (
                <span key={idx}>{em}</span>
              ))}
              {message.reactions.length > 1 && (
                <span className="text-[9px] text-gray-300 font-bold ml-0.5">
                  {message.reactions.length}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Desktop Action Bar (Hover on right) */}
        <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 px-1">
          <button
            type="button"
            onClick={() => setShowPicker((prev) => !prev)}
            className="p-1 rounded-full hover:bg-gray-800 hover:text-white transition cursor-pointer"
            title="React with emoji"
          >
            <FiSmile size={15} />
          </button>
          <button
            type="button"
            onClick={() => onReply && onReply(message)}
            className="p-1 rounded-full hover:bg-gray-800 hover:text-white transition cursor-pointer"
            title="Reply to message"
          >
            <FiCornerUpLeft size={15} />
          </button>
        </div>
      </div>

      {timeString && (
        <span className="text-[10px] text-gray-500 font-medium mt-1.5 ml-1">
          {timeString}
        </span>
      )}
    </div>
  );
}

export default ReceiverMessage;
