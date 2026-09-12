import React, { useState, useRef } from "react";
import { FiSmile, FiCornerUpLeft, FiTrash2 } from "react-icons/fi";
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

function SenderMessage({
  message,
  onReact,
  onReply,
  onScrollToMessage,
  onUnsend,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showUnsendModal, setShowUnsendModal] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const lastTapRef = useRef(0);
  const touchStartXRef = useRef(0);
  const longPressTimerRef = useRef(null);

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
    longPressTimerRef.current = setTimeout(() => {
      setShowUnsendModal(true);
    }, 550);
  };

  const handleTouchMove = (e) => {
    const diff = e.touches[0].clientX - touchStartXRef.current;
    if (Math.abs(diff) > 10 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (diff > 0 && diff < 85) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (swipeOffset > 45 && onReply) {
      onReply(message);
    }
    setSwipeOffset(0);
  };

  return (
    <div
      id={`msg-${message._id}`}
      className="flex flex-col items-end my-1 self-end w-full group relative select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowUnsendModal(true);
      }}
    >
      {/* Swipe Reply Arrow Indicator */}
      {swipeOffset > 15 && (
        <div
          style={{ opacity: Math.min(1, swipeOffset / 45) }}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gray-800 text-indigo-400 flex items-center justify-center shadow-md transition-opacity"
        >
          <FiCornerUpLeft size={16} />
        </div>
      )}

      {/* Main container with swipe translation */}
      <div
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className="flex items-center gap-1.5 max-w-[85%] sm:max-w-[70%] transition-transform duration-75 relative"
      >
        {/* Desktop Action Bar (Hover to reveal) */}
        <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 px-1">
          <button
            type="button"
            onClick={() => onReply && onReply(message)}
            className="p-1 rounded-full hover:bg-gray-800 hover:text-white transition cursor-pointer"
            title="Reply to message"
          >
            <FiCornerUpLeft size={15} />
          </button>
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
            onClick={() => setShowUnsendModal(true)}
            className="p-1 rounded-full hover:bg-red-500/20 hover:text-red-400 transition cursor-pointer text-gray-400"
            title="Unsend message"
          >
            <FiTrash2 size={14} />
          </button>
        </div>

        {/* Reaction Picker Popup */}
        {showPicker && (
          <ReactionPicker
            isSender={true}
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
          className="flex flex-col items-end relative cursor-pointer"
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
              className="w-full bg-black/30 hover:bg-black/50 border-l-2 border-indigo-300 rounded-lg px-2.5 py-1 mb-1 text-left cursor-pointer transition flex flex-col gap-0.5"
            >
              <span className="text-[10px] font-bold text-indigo-200 truncate">
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
                <div className="rounded-2xl overflow-hidden mb-1 border border-indigo-500/30 max-w-[260px] max-h-[260px] shadow-lg">
                  <img
                    src={message.image}
                    alt="Sent attachment"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {message.audio && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2 text-xs font-medium shadow-md mb-1">
                  <VoiceNotePlayer
                    audioUrl={message.audio}
                    duration={message.audioDuration}
                    isSender={true}
                  />
                </div>
              )}

              {textContent && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs sm:text-sm font-medium leading-relaxed shadow-md break-words text-left">
                  {textContent}
                </div>
              )}
            </>
          )}

          {/* Reaction Badge at bottom right of bubble */}
          {message.reactions && message.reactions.length > 0 && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowPicker((prev) => !prev);
              }}
              className="absolute -bottom-2.5 right-1.5 z-10 flex items-center gap-0.5 bg-[#18181b]/95 border border-gray-700/80 rounded-full px-1.5 py-0.5 shadow-md text-xs cursor-pointer hover:scale-105 transition"
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
      </div>

      {timeString && (
        <span className="text-[10px] text-gray-500 font-medium mt-1.5 mr-1">
          {timeString}
        </span>
      )}

      {/* Unsend Confirmation Modal */}
      {showUnsendModal && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowUnsendModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181b] border border-gray-800 rounded-3xl w-full max-w-xs p-6 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-150 select-none"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-3">
              <FiTrash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Unsend message?
            </h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Unsend will remove the message for everyone in the chat. People may have already seen or listened to it.
            </p>
            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowUnsendModal(false);
                  if (onUnsend) onUnsend(message._id);
                }}
                className="w-full py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-red-600/30 active:scale-95"
              >
                Unsend
              </button>
              <button
                type="button"
                onClick={() => setShowUnsendModal(false)}
                className="w-full py-2.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SenderMessage;