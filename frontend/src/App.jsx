import React, { useState, useCallback } from "react";

// Import components
import { DarkModeToggle } from "./components/ui";
import { DashboardView, ChatView, AnalyticsView } from "./components/views";

// Import hooks and utilities
import { useDarkMode } from "./hooks";
import { createChartFromAI, processShipmentData } from "./utils";

export default function App() {
  // State management
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
  const [activeView, setActiveView] = useState("dashboard");

  // Dark mode hook
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  // Calculate dashboard metrics
  const calculateMetrics = useCallback((data) => {
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
  }, []);

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
        {activeView === "dashboard" && (
          <DashboardView
            isDarkMode={isDarkMode}
            dashboardMetrics={dashboardMetrics}
            prompt={prompt}
            setPrompt={setPrompt}
            loading={loading}
            ask={ask}
            showVegaChart={showVegaChart}
            vegaSpec={vegaSpec}
            rows={rows}
          />
        )}
        {activeView === "chat" && (
          <ChatView
            isDarkMode={isDarkMode}
            chatMessages={chatMessages}
            prompt={prompt}
            setPrompt={setPrompt}
            loading={loading}
            ask={ask}
          />
        )}
        {activeView === "analytics" && (
          <AnalyticsView
            isDarkMode={isDarkMode}
            aiGenerated={aiGenerated}
            currentChartConfig={currentChartConfig}
            showVegaChart={showVegaChart}
            vegaSpec={vegaSpec}
            rows={rows}
            fields={fields}
            autoSpec={autoSpec}
          />
        )}
      </main>
    </div>
  );
}
