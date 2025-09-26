import { useState, useEffect } from "react";
import { GraphicWalker } from "@kanaries/graphic-walker";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [rows, setRows] = useState([]);
  const [fields, setFields] = useState([]);
  const [autoSpec, setAutoSpec] = useState(null);
  const [loading, setLoading] = useState(false);

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
      const { data, suggestedVegaLite } = await res.json();

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
      setAutoSpec(suggestedVegaLite || null);
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
          placeholder="e.g., show top 10 BaseProductCode by total GrossQuantity in 2025"
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
        <div className="text-xs text-gray-500 mt-2">
          Try: "show products", "top shipments", "flow rates"
        </div>
      </div>

      <div className="col-span-2">
        {rows.length > 0 ? (
          <GraphicWalker
            data={rows}
            fields={fields}
            spec={autoSpec ?? undefined}
          />
        ) : (
          <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <div className="text-gray-500 mb-4">📊 No data loaded yet</div>
              <div className="text-sm text-gray-400">
                Run a query to see the drag-and-drop interface
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
