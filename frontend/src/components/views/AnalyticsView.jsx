import React from "react";
import { GraphicWalker } from "@kanaries/graphic-walker";
import VegaChart from "../ui/VegaChart";

function AnalyticsView({
  isDarkMode,
  aiGenerated,
  currentChartConfig,
  showVegaChart,
  vegaSpec,
  rows,
  fields,
  autoSpec,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Advanced Analytics
        </h1>
        {aiGenerated && currentChartConfig && (
          <div
            className={`border rounded-lg px-4 py-3 max-w-md ${
              isDarkMode
                ? "bg-green-900 border-green-700"
                : "bg-green-50 border-green-200"
            }`}
          >
            <div
              className={`text-sm font-medium ${
                isDarkMode ? "text-green-300" : "text-green-800"
              }`}
            >
              AI <strong>{currentChartConfig.chartType}</strong> chart generated
            </div>
            <div
              className={`text-xs mt-1 ${
                isDarkMode ? "text-green-400" : "text-green-600"
              }`}
            >
              X-axis: {currentChartConfig.xField} • Y-axis:{" "}
              {currentChartConfig.yField}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* AI Generated Chart */}
        {showVegaChart && vegaSpec && (
          <div
            className={`rounded-lg shadow-sm border overflow-hidden ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`px-6 py-4 border-b ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <h2
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                AI-Generated Visualization
              </h2>
              <p
                className={`text-sm mt-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Automatically created based on your query
              </p>
            </div>
            <div className="p-6">
              <VegaChart spec={vegaSpec} data={rows} />
            </div>
          </div>
        )}

        {/* Manual Chart Builder */}
        <div
          className={`rounded-lg shadow-sm border overflow-hidden ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div
            className={`px-6 py-4 border-b ${
              isDarkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <h2
              className={`text-lg font-semibold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Custom Chart Builder
            </h2>
            <p
              className={`text-sm mt-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Drag and drop fields to create custom visualizations
            </p>
          </div>
          <div className="relative" style={{ height: "500px" }}>
            {rows.length > 0 ? (
              <GraphicWalker
                data={rows}
                fields={fields}
                chart={autoSpec}
                appearance={isDarkMode ? "dark" : "light"}
              />
            ) : (
              <div
                className={`flex items-center justify-center h-full ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-2">No data available</div>
                  <div className="text-sm">
                    Run a query to load data for visualization
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsView;
