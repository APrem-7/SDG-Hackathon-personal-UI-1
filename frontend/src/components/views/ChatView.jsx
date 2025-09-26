import React from "react";
import ChatMessage from "../ui/ChatMessage";
import SuggestedQueries from "../ui/SuggestedQueries";

function ChatView({
  isDarkMode,
  chatMessages,
  prompt,
  setPrompt,
  loading,
  ask,
}) {
  return (
    <div
      className={`h-screen flex flex-col ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div
        className={`border-b px-6 py-4 ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <h1
          className={`text-xl font-semibold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          AI Chat Interface
        </h1>
        <p
          className={`text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Create and modify your dashboards
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {chatMessages.length === 0 ? (
          <div
            className={`text-center mt-20 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <div className="text-4xl mb-4">💬</div>
            <h2
              className={`text-xl font-semibold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Start a conversation
            </h2>
            <p className="mb-6">Ask me anything about your shipment data!</p>
            <SuggestedQueries
              onQuerySelect={(query) => ask(query)}
              isDark={isDarkMode}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((msg, idx) => (
              <ChatMessage key={idx} {...msg} isDark={isDarkMode} />
            ))}
          </div>
        )}
      </div>

      <div
        className={`border-t p-4 ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your question here..."
            className={`flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            autoFocus
          />
          <button
            onClick={() => ask()}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatView;
