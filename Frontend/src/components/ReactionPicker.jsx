import React, { useEffect, useRef } from "react";

const EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👍"];

function ReactionPicker({ onSelectEmoji, onClose, currentEmoji = null, isSender = false }) {
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className={`absolute -top-12 z-30 flex items-center gap-1.5 bg-[#1e1e24]/95 backdrop-blur-md border border-gray-700/70 rounded-full px-2.5 py-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-150 select-none ${
        isSender ? "right-0" : "left-0"
      }`}
    >
      {EMOJIS.map((emoji) => {
        const isSelected = currentEmoji === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectEmoji(emoji);
            }}
            className={`w-7 h-7 flex items-center justify-center text-lg rounded-full transition-transform transform hover:scale-135 active:scale-95 cursor-pointer ${
              isSelected ? "bg-white/20 scale-110" : "hover:bg-white/10"
            }`}
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}

export default ReactionPicker;
