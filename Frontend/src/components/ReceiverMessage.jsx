import React from "react";
import dp from "../assets/dp.png";

function ReceiverMessage({ message, authorImage }) {
  const timeString = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const textContent = message.messages || message.message;

  return (
    <div className="flex items-start gap-2.5 my-1 self-start w-full">
      <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-800 bg-gray-900 flex-shrink-0 mt-0.5">
        <img
          src={authorImage || dp}
          alt="Sender Avatar"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col items-start max-w-[78%] sm:max-w-[68%]">
        {message.image && (
          <div className="rounded-2xl overflow-hidden mb-1 border border-gray-800 max-w-[260px] max-h-[260px] shadow-lg">
            <img
              src={message.image}
              alt="Received attachment"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {textContent && (
          <div className="bg-[#262626] text-white rounded-2xl rounded-tl-xs px-4 py-2.5 text-xs sm:text-sm font-medium leading-relaxed shadow-md border border-gray-800/90 break-words text-left">
            {textContent}
          </div>
        )}

        {timeString && (
          <span className="text-[10px] text-gray-500 font-medium mt-1 ml-1">
            {timeString}
          </span>
        )}
      </div>
    </div>
  );
}

export default ReceiverMessage;
