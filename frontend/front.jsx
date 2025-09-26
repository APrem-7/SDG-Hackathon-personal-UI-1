// App.tsx (React)
import { useState } from "react";
import { GraphicWalker } from "@kanaries/graphic-walker"; // official embed
// npm i @kanaries/graphic-walker

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [autoSpec, setAutoSpec] = useState<any | null>(null);

  async function ask() {
    const res = await fetch("/api/nlq", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ prompt })
    });
    const { data, suggestedVegaLite } = await res.json();

    // Build fields (Graphic Walker needs field metadata)
    const inferType = (v: any) =>
      (typeof v === "number") ? "quantitative"
      : (/\d{4}-\d{2}-\d{2}/.test(String(v))) ? "temporal"
      : "nominal";

    const f = Object.keys(data[0] || {}).map(k => ({
      fid: k,
      name: k,
      semanticType: inferType(data[0]?.[k]),
      analyticType: inferType(data[0]?.[k]) === "quantitative" ? "measure" : "dimension"
    }));

    setRows(data);
    setFields(f);
    setAutoSpec(suggestedVegaLite || null);
  }

  return (
    <div className="p-4 grid grid-cols-3 gap-4">
      <div className="col-span-1 space-y-2">
        <h2>Ask the data</h2>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g., show top 10 BaseProductCode by total GrossQuantity in 2025"
          className="w-full h-40 border rounded p-2"
        />
        <button onClick={ask} className="border rounded px-3 py-2">Run</button>
        {rows.length > 0 && <div>Returned rows: {rows.length}</div>}
      </div>

      <div className="col-span-2">
        <GraphicWalker
          data={rows}
          fields={fields}
          spec={autoSpec ?? undefined}
        />
      </div>
    </div>
  );
}
