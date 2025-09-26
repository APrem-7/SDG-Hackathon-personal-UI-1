import React from "react";

function SuggestedQueries({ onQuerySelect, isDark = false }) {
  const suggestions = [
    "Show me total shipments by year",
    "Create a pie chart of product distribution",
    "Bar chart of flow rates by bay code",
    "Show shipment trends over time",
    "Analyze top performing products",
    "Display monthly shipment volumes",
  ];

  return (
    <div
      className={`p-4 rounded-lg ${
        isDark ? "bg-gray-800 border border-gray-700" : "bg-gray-50"
      }`}
    >
      <h4
        className={`text-sm font-medium mb-2 ${
          isDark ? "text-gray-300" : "text-gray-700"
        }`}
      >
        Try these queries:
      </h4>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onQuerySelect(suggestion)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              isDark
                ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300"
            }`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SuggestedQueries;
