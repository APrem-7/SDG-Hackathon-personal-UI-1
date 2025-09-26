import React from "react";

function MetricWidget({
  title,
  value,
  change,
  color = "blue",
  isDark = false,
}) {
  return (
    <div
      className={`p-4 rounded-lg shadow border ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <h3
        className={`text-sm font-medium ${
          isDark ? "text-gray-300" : "text-gray-600"
        }`}
      >
        {title}
      </h3>
      <div className="mt-2 flex items-baseline">
        <p
          className={`text-2xl font-semibold text-${color}-${
            isDark ? "400" : "600"
          }`}
        >
          {value}
        </p>
        {change && (
          <p
            className={`ml-2 text-sm ${
              change > 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {change > 0 ? "+" : ""}
            {change}%
          </p>
        )}
      </div>
    </div>
  );
}

export default MetricWidget;
