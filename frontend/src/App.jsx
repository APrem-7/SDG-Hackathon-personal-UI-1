import { useState, useEffect, useRef } from "react";
import { GraphicWalker } from "@kanaries/graphic-walker";
import vegaEmbed from "vega-embed";

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

  console.log("📊 Creating chart for:", {
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

  console.log("📊 Generated chart spec:", chartSpec);
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
        data: { values: data }
      };

      // Render the chart
      vegaEmbed(chartRef.current, chartSpec, {
        renderer: 'svg',
        actions: false,
        width: 600,
        height: 400
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

  // No initial data loading - user must run queries

  async function loadInitialData() {
    try {
      const res = await fetch("/api/nlq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "show product summary" }),
      });
      const { data, suggestedVegaLite } = await res.json();

      if (data && data.length > 0) {
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
        setAutoSpec(suggestedVegaLite || null);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  }

  async function ask() {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/nlq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const { data, chartSpec, chartConfig, explanation, aiPowered } =
        await res.json();

      // Build fields (Graphic Walker needs field metadata)
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
          inferType(data[0]?.[k]) === "quantitative" ? "measure" : "dimension",
      }));

      setRows(data);
      setFields(f);

      // Use AI-generated chart spec if available
      if (chartConfig && aiPowered) {
        console.log("🎨 Auto-generating chart:", chartConfig);
        setCurrentChartConfig(chartConfig);
        
        // Use the Vega-Lite spec from backend if available
        if (chartSpec) {
          console.log("📊 Using Vega-Lite spec directly:", chartSpec);
          setVegaSpec(chartSpec);
          setShowVegaChart(true);
          setAiGenerated(true);
        } else {
          // Fallback to GraphicWalker approach
          const gwSpec = createChartFromAI(chartConfig, f);
          if (gwSpec) {
            setAutoSpec(gwSpec);
            setShowVegaChart(false);
            setAiGenerated(true);
          } else {
            setAutoSpec(null);
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
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error fetching data. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 grid grid-cols-3 gap-4">
      <div className="col-span-1 space-y-2">
        <h2 className="text-xl font-bold">Ask the data</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'bar chart of shipment quantities by product code' or 'line chart showing flow rates over time'"
          className="w-full h-40 border rounded p-2"
        />
        <button
          onClick={ask}
          disabled={loading}
          className="border rounded px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? "Processing..." : "Run Query"}
        </button>
        {rows.length > 0 && (
          <div className="text-sm text-green-600">
            ✅ Loaded {rows.length} records
          </div>
        )}
        {aiGenerated && currentChartConfig && (
          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
            🤖 AI Generated: <strong>{currentChartConfig.chartType}</strong> chart
            <br />
            📊 X-axis: <strong>{currentChartConfig.xField}</strong>, Y-axis:{" "}
            <strong>{currentChartConfig.yField}</strong>
            <br />
            {showVegaChart ? (
              <em className="text-green-600">✅ Chart automatically generated above!</em>
            ) : (
              <em>Chart configuration applied to manual builder below</em>
            )}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-2">
          Try: "bar chart of shipments by product", "scatter plot of quantity vs
          flow rate", "pie chart of shipments by year"
        </div>
      </div>

      <div className="col-span-2">
        {rows.length > 0 ? (
          <div className="space-y-4">
            {/* Show AI-generated Vega-Lite chart if available */}
            {showVegaChart && vegaSpec ? (
              <div className="border rounded-lg p-4 bg-white">
                <div className="mb-2 text-sm font-medium text-green-600">
                  🤖 AI Generated Chart (Fully Automatic)
                </div>
                <VegaChart spec={vegaSpec} data={rows} />
              </div>
            ) : null}
            
            {/* Always show GraphicWalker for manual exploration */}
            <div className="border rounded-lg">
              <div className="p-2 bg-gray-50 text-sm text-gray-600">
                📊 Manual Chart Builder (Drag & Drop)
              </div>
              <GraphicWalker data={rows} fields={fields} initialSpec={autoSpec} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <div className="text-gray-500 mb-4">📊 No data loaded yet</div>
              <div className="text-sm text-gray-400">
                Run a query to see automatic chart generation
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
