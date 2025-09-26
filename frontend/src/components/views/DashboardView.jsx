import React from "react";
import MetricWidget from "../ui/MetricWidget";
import SuggestedQueries from "../ui/SuggestedQueries";
import VegaChart from "../ui/VegaChart";

function DashboardView({
  isDarkMode,
  dashboardMetrics,
  prompt,
  setPrompt,
  loading,
  ask,
  showVegaChart,
  vegaSpec,
  rows,
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          AI-Powered Analytics Dashboard
        </h1>
        <div
          className={`text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Real-time insights from{" "}
          {dashboardMetrics.totalShipments.toLocaleString()} shipment records
        </div>
      </div>

      {/* Metrics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricWidget
          title="Total Shipments"
          value={dashboardMetrics.totalShipments.toLocaleString()}
          color="blue"
          isDark={isDarkMode}
        />
        <MetricWidget
          title="Average Flow Rate"
          value={`${dashboardMetrics.avgFlowRate} L/min`}
          color="green"
          isDark={isDarkMode}
        />
        <MetricWidget
          title="Unique Products"
          value={dashboardMetrics.totalProducts.toLocaleString()}
          color="purple"
          isDark={isDarkMode}
        />
        <MetricWidget
          title="Average Quantity"
          value={`${dashboardMetrics.avgQuantity} units`}
          color="orange"
          isDark={isDarkMode}
        />
      </div>

      {/* Quick Actions */}
      <div
        className={`p-6 rounded-lg shadow border ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <h2
          className={`text-lg font-semibold mb-4 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          AI Assistant
        </h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask me anything about your shipment data..."
            className={`flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            onKeyPress={(e) => e.key === "Enter" && ask()}
          />
          <button
            onClick={() => ask()}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? "Loading..." : "Ask AI"}
          </button>
        </div>
        <SuggestedQueries
          onQuerySelect={(query) => ask(query)}
          isDark={isDarkMode}
        />
      </div>

      {/* Latest Chart */}
      {showVegaChart && vegaSpec && (
        <div
          className={`p-6 rounded-lg shadow border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h2
            className={`text-lg font-semibold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Latest AI-Generated Insight
          </h2>
          <VegaChart spec={vegaSpec} data={rows} />
        </div>
      )}
    </div>
  );
}

export default DashboardView;
