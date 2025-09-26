import React, { useState, useEffect, useRef, useCallback } from "react";
import { GraphicWalker } from "@kanaries/graphic-walker";
import vegaEmbed from "vega-embed";

// Dark Mode Toggle Component
function DarkModeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-lg border transition-colors ${
        isDark
          ? "bg-gray-700 text-yellow-400 border-gray-600 hover:bg-gray-600"
          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
      }`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}

// Custom Widget Components
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

// Create GraphicWalker chart specification from AI response
function createChartFromAI(chartConfig, fields) {
  if (!chartConfig) return null;

  const { chartType, xField, yField, title } = chartConfig;

  // Find the fields in our field metadata
  const xFieldMeta = fields.find((f) => f.fid === xField);
  const yFieldMeta = fields.find((f) => f.fid === yField);

  if (!xFieldMeta || !yFieldMeta) {
    console.warn("Chart fields not found:", {
      xField,
      yField,
      availableFields: fields.map((f) => f.fid),
    });
    return null;
  }

  // Create a simple chart specification for GraphicWalker
  const chartSpec = {
    visId: "gw_chart_1",
    name: title || "AI Generated Chart",
    encodings: {
      dimensions: [],
      measures: [],
      rows: [],
      columns: [],
      color: [],
      opacity: [],
      size: [],
      shape: [],
      radius: [],
      theta: [],
      longitude: [],
      latitude: [],
      geoId: [],
      details: [],
      filters: [],
      text: [],
    },
    config: {
      defaultAggregated: false,
      geoms: [
        chartType === "scatter"
          ? "point"
          : chartType === "pie"
          ? "arc"
          : chartType,
      ],
      coordSystem: "generic",
      stack: "none",
      showActions: false,
      interactiveScale: false,
      sorted: "none",
      zeroScale: true,
      scaleIncludeUnmatchedChoropleth: false,
      showAllGeomTypes: false,
      resolve: {
        x: false,
        y: false,
        color: false,
        opacity: false,
        shape: false,
        size: false,
      },
      limit: -1,
    },
  };

  console.log("Creating chart for:", {
    chartType,
    xField,
    yField,
    xFieldMeta,
    yFieldMeta,
  });

  // Configure encodings based on chart type and field types
  if (chartType === "bar") {
    if (xFieldMeta.analyticType === "dimension") {
      chartSpec.encodings.dimensions.push(xField);
      chartSpec.encodings.columns.push(xField);
    } else {
      chartSpec.encodings.measures.push(xField);
      chartSpec.encodings.columns.push(xField);
    }

    if (yFieldMeta.analyticType === "measure") {
      chartSpec.encodings.measures.push(yField);
      chartSpec.encodings.rows.push(yField);
    } else {
      chartSpec.encodings.dimensions.push(yField);
      chartSpec.encodings.rows.push(yField);
    }
  } else if (chartType === "scatter" || chartType === "point") {
    chartSpec.encodings.measures.push(xField, yField);
    chartSpec.encodings.columns.push(xField);
    chartSpec.encodings.rows.push(yField);
  } else if (chartType === "line") {
    if (xFieldMeta.analyticType === "dimension") {
      chartSpec.encodings.dimensions.push(xField);
      chartSpec.encodings.columns.push(xField);
    } else {
      chartSpec.encodings.measures.push(xField);
      chartSpec.encodings.columns.push(xField);
    }

    if (yFieldMeta.analyticType === "measure") {
      chartSpec.encodings.measures.push(yField);
      chartSpec.encodings.rows.push(yField);
    }
  } else if (chartType === "pie") {
    chartSpec.encodings.dimensions.push(xField);
    chartSpec.encodings.color.push(xField);
    chartSpec.encodings.measures.push(yField);
    chartSpec.encodings.theta.push(yField);
  }

  // Remove duplicates
  chartSpec.encodings.dimensions = [...new Set(chartSpec.encodings.dimensions)];
  chartSpec.encodings.measures = [...new Set(chartSpec.encodings.measures)];

  console.log("Generated chart spec:", chartSpec);
  return [chartSpec];
}

// Direct Vega-Lite Chart Component
function VegaChart({ spec, data }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (spec && data && chartRef.current) {
      // Embed the chart data into the spec
      const chartSpec = {
        ...spec,
        data: { values: data },
      };

      // Render the chart
      vegaEmbed(chartRef.current, chartSpec, {
        renderer: "svg",
        actions: false,
        width: 600,
        height: 400,
      }).catch(console.error);
    }
  }, [spec, data]);

  if (!spec) return null;

  return <div ref={chartRef} className="w-full h-96 border rounded"></div>;
}

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [rows, setRows] = useState([]);
  const [fields, setFields] = useState([]);
  const [autoSpec, setAutoSpec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [currentChartConfig, setCurrentChartConfig] = useState(null);
  const [vegaSpec, setVegaSpec] = useState(null);
  const [showVegaChart, setShowVegaChart] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalShipments: 0,
    avgFlowRate: 0,
    totalProducts: 0,
    avgQuantity: 0,
  });
  const [activeView, setActiveView] = useState("dashboard"); // 'dashboard', 'chat', 'analytics'

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  // Toggle dark mode and save preference
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem("darkMode", JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  // Calculate dashboard metrics
  function calculateMetrics(data) {
    if (!data || data.length === 0) return;

    const totalShipments = data.length;
    const avgFlowRate =
      data.reduce((sum, item) => sum + (item.FlowRate || 0), 0) /
      totalShipments;
    const uniqueProducts = new Set(data.map((item) => item.BaseProductCode))
      .size;
    const avgQuantity =
      data.reduce((sum, item) => sum + (item.GrossQuantity || 0), 0) /
      totalShipments;

    setDashboardMetrics({
      totalShipments,
      avgFlowRate: Math.round(avgFlowRate * 100) / 100,
      totalProducts: uniqueProducts,
      avgQuantity: Math.round(avgQuantity * 100) / 100,
    });
  }

  const ask = useCallback(
    async (queryText = prompt) => {
      if (!queryText.trim()) return;

      setLoading(true);
      const timestamp = new Date().toLocaleTimeString();

      // Add user message to chat
      setChatMessages((prev) => [
        ...prev,
        {
          message: queryText,
          isUser: true,
          timestamp,
        },
      ]);

      try {
        const res = await fetch("/api/nlq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: queryText }),
        });
        const response = await res.json();
        const { data, chartSpec, chartConfig, explanation, aiPowered } =
          response;

        // Add AI response to chat
        setChatMessages((prev) => [
          ...prev,
          {
            message:
              explanation ||
              "I've analyzed your data and created a visualization.",
            isUser: false,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);

        // Build fields
        const inferType = (v) =>
          typeof v === "number"
            ? "quantitative"
            : /\d{4}-\d{2}-\d{2}/.test(String(v))
            ? "temporal"
            : "nominal";

        const f = Object.keys(data[0] || {}).map((k) => ({
          fid: k,
          name: k,
          semanticType: inferType(data[0]?.[k]),
          analyticType:
            inferType(data[0]?.[k]) === "quantitative"
              ? "measure"
              : "dimension",
        }));

        setRows(data);
        setFields(f);
        calculateMetrics(data);

        // Handle AI-generated charts
        if (chartConfig && aiPowered) {
          console.log("Auto-generating chart:", chartConfig);
          setCurrentChartConfig(chartConfig);

          if (chartSpec) {
            console.log("Using Vega-Lite spec directly:", chartSpec);
            setVegaSpec(chartSpec);
            setShowVegaChart(true);
            setAiGenerated(true);
          } else {
            const gwSpec = createChartFromAI(chartConfig, f);
            if (gwSpec) {
              setAutoSpec(gwSpec);
              setShowVegaChart(false);
              setAiGenerated(true);
            }
          }
        } else {
          setAutoSpec(null);
          setVegaSpec(null);
          setShowVegaChart(false);
          setAiGenerated(false);
          setCurrentChartConfig(null);
        }

        // Switch to analytics view when chart is generated
        if (chartConfig) {
          setActiveView("analytics");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setChatMessages((prev) => [
          ...prev,
          {
            message:
              "Sorry, I encountered an error processing your request. Please make sure the backend is running.",
            isUser: false,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } finally {
        setLoading(false);
        setPrompt("");
      }
    },
    [prompt]
  );

  // Dashboard View
  const DashboardView = useCallback(
    () => (
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
    ),
    [
      dashboardMetrics,
      prompt,
      loading,
      ask,
      showVegaChart,
      vegaSpec,
      rows,
      isDarkMode,
    ]
  );

  // Chat View - Memoized to prevent re-rendering and focus loss
  const ChatView = useCallback(
    () => (
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
    ),
    [chatMessages, prompt, loading, ask, isDarkMode]
  );

  // Analytics View
  const AnalyticsView = useCallback(
    () => (
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
                AI <strong>{currentChartConfig.chartType}</strong> chart
                generated
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
    ),
    [
      aiGenerated,
      currentChartConfig,
      showVegaChart,
      vegaSpec,
      rows,
      fields,
      autoSpec,
      isDarkMode,
    ]
  );

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Navigation */}
      <nav
        className={`shadow border-b ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1
                className={`text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                ShipmentIQ Analytics
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {/* Navigation Tabs */}
              <div className="flex space-x-1">
                {[
                  { key: "dashboard", label: "Dashboard" },
                  { key: "chat", label: "AI Chat" },
                  { key: "analytics", label: "Analytics" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveView(key)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeView === key
                        ? isDarkMode
                          ? "bg-blue-900 text-blue-300 border border-blue-700"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                        : isDarkMode
                        ? "text-gray-300 hover:text-white hover:bg-gray-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Dark Mode Toggle */}
              <DarkModeToggle isDark={isDarkMode} onToggle={toggleDarkMode} />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        {activeView === "dashboard" && <DashboardView />}
        {activeView === "chat" && <ChatView />}
        {activeView === "analytics" && <AnalyticsView />}
      </main>
    </div>
  );
}
