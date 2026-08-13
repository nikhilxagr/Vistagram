import React from "react";
import ReelMessageCard from "./ReelMessageCard";

function parseReelShare(text) {
  if (!text || !text.includes('"type":"reel_share"')) return null;
  try {
    const data = JSON.parse(text);
    return data?.type === "reel_share" ? data : null;
  } catch {
    return null;
  }
}

function SenderMessage({ message }) {
  const timeString = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const textContent = message.messages || message.message;
  const reelData = parseReelShare(textContent);

  return (
    <div className="flex flex-col items-end my-1 self-end w-full">
      <div className="flex flex-col items-end max-w-[78%] sm:max-w-[68%]">

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

            {textContent && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs sm:text-sm font-medium leading-relaxed shadow-md break-words text-left">
                {textContent}
              </div>
            )}
          </>
        )}

        {timeString && (
          <span className="text-[10px] text-gray-500 font-medium mt-1 mr-1">
            {timeString}
          </span>
        )}
      </div>
    </div>
  );
}

export default SenderMessage;