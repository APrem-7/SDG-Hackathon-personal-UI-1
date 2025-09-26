import React from "react";

function ChatMessage({ message, isUser, timestamp, isDark = false }) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser
            ? "bg-blue-500 text-white"
            : isDark
            ? "bg-gray-700 text-gray-100 border border-gray-600"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        <p className="text-sm">{message}</p>
        <p className="text-xs mt-1 opacity-70">{timestamp}</p>
      </div>
    </div>
  );
}

export default ChatMessage;
