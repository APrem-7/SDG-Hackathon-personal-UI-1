import React, { useState, useEffect, useRef, useCallback } from "react";
import { GraphicWalker } from "@kanaries/graphic-walker";
import vegaEmbed from "vega-embed";

// Custom Widget Components
function MetricWidget({ title, value, change, color = "blue" }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className={`text-2xl font-semibold text-${color}-600`}>{value}</p>
        {change && (
          <p
            className={`ml-2 text-sm ${
              change > 0 ? "text-green-600" : "text-red-600"
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

function ChatMessage({ message, isUser, timestamp }) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
        }`}
      >
        <p className="text-sm">{message}</p>
        <p className="text-xs mt-1 opacity-70">{timestamp}</p>
      </div>
    </div>
  );
}

function SuggestedQueries({ onQuerySelect }) {
  const suggestions = [
    "Show me total shipments by year",
    "Create a pie chart of product distribution",
    "Bar chart of flow rates by bay code",
    "Show shipment trends over time",
    "Analyze top performing products",
    "Display monthly shipment volumes",
  ];

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-sm font-medium text-gray-700 mb-2">
        Try these queries:
      </h4>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onQuerySelect(suggestion)}
            className="text-xs bg-white px-3 py-1 rounded-full border hover:bg-blue-50 hover:border-blue-300 transition-colors"
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
          <h1 className="text-2xl font-bold text-gray-900">
            AI-Powered Analytics Dashboard
          </h1>
          <div className="text-sm text-gray-500">
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
          />
          <MetricWidget
            title="Average Flow Rate"
            value={`${dashboardMetrics.avgFlowRate} L/min`}
            color="green"
          />
          <MetricWidget
            title="Unique Products"
            value={dashboardMetrics.totalProducts.toLocaleString()}
            color="purple"
          />
          <MetricWidget
            title="Average Quantity"
            value={`${dashboardMetrics.avgQuantity} units`}
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-4">AI Assistant</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask me anything about your shipment data..."
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <SuggestedQueries onQuerySelect={(query) => ask(query)} />
        </div>

        {/* Latest Chart */}
        {showVegaChart && vegaSpec && (
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold mb-4">
              Latest AI-Generated Insight
            </h2>
            <VegaChart spec={vegaSpec} data={rows} />
          </div>
        )}
      </div>
    ),
    [dashboardMetrics, prompt, loading, ask, showVegaChart, vegaSpec, rows]
  );

  // Chat View - Memoized to prevent re-rendering and focus loss
  const ChatView = useCallback(
    () => (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <h1 className="text-xl font-semibold">AI Chat Interface</h1>
          <p className="text-sm text-gray-600">
            Create and modify your dashboards
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <div className="text-4xl mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">
                Start a conversation
              </h2>
              <p className="mb-6">Ask me anything about your shipment data!</p>
              <SuggestedQueries onQuerySelect={(query) => ask(query)} />
            </div>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((msg, idx) => (
                <ChatMessage key={idx} {...msg} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your question here..."
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    [chatMessages, prompt, loading, ask]
  );

  // Analytics View
  const AnalyticsView = useCallback(
    () => (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Advanced Analytics
          </h1>
          {aiGenerated && currentChartConfig && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 max-w-md">
              <div className="text-sm font-medium text-green-800">
                AI <strong>{currentChartConfig.chartType}</strong> chart
                generated
              </div>
              <div className="text-xs text-green-600 mt-1">
                X-axis: {currentChartConfig.xField} • Y-axis:{" "}
                {currentChartConfig.yField}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* AI Generated Chart */}
          {showVegaChart && vegaSpec && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  AI-Generated Visualization
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically created based on your query
                </p>
              </div>
              <div className="p-6">
                <VegaChart spec={vegaSpec} data={rows} />
              </div>
            </div>
          )}

          {/* Manual Chart Builder */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Custom Chart Builder
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Drag and drop fields to create custom visualizations
              </p>
            </div>
            <div className="relative" style={{ height: "500px" }}>
              {rows.length > 0 ? (
                <GraphicWalker
                  data={rows}
                  fields={fields}
                  chart={autoSpec}
                  appearance="light"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
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
    ]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">
                ShipmentIQ Analytics
              </h1>
            </div>
            <div className="flex space-x-1">
              {[
                { key: "dashboard", label: "Dashboard" },
                { key: "chat", label: "AI Chat" },
                { key: "analytics", label: "Analytics" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveView(key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeView === key
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              ))}
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
