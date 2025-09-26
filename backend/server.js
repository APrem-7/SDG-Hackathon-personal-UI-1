// server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import Ajv from "ajv";
import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

// Mock data for testing
const mockShipmentData = [
  {
    GrossQuantity: 1000,
    FlowRate: 25.5,
    ShipmentCompartmentID: "SC001",
    BaseProductID: "BP001",
    BaseProductCode: "ABC123",
    ShipmentID: "SH001",
    ShipmentCode: "SHC001",
    ExitTime: "2025-01-15T10:30:00",
    BayCode: "BAY01",
    ScheduledDate: "2025-01-15",
    CreatedTime: "2025-01-14T08:00:00"
  },
  {
    GrossQuantity: 1500,
    FlowRate: 30.2,
    ShipmentCompartmentID: "SC002",
    BaseProductID: "BP002",
    BaseProductCode: "DEF456",
    ShipmentID: "SH002",
    ShipmentCode: "SHC002",
    ExitTime: "2025-01-16T14:20:00",
    BayCode: "BAY02",
    ScheduledDate: "2025-01-16",
    CreatedTime: "2025-01-15T09:30:00"
  },
  {
    GrossQuantity: 800,
    FlowRate: 20.1,
    ShipmentCompartmentID: "SC003",
    BaseProductID: "BP001",
    BaseProductCode: "ABC123",
    ShipmentID: "SH003",
    ShipmentCode: "SHC003",
    ExitTime: "2025-01-17T11:45:00",
    BayCode: "BAY01",
    ScheduledDate: "2025-01-17",
    CreatedTime: "2025-01-16T07:15:00"
  }
];

// Process the mock data to add aggregated results
const processedData = [
  { BaseProductCode: "ABC123", total_quantity: 1800, avg_flow_rate: 22.8 },
  { BaseProductCode: "DEF456", total_quantity: 1500, avg_flow_rate: 30.2 }
];

// Schema for LLM validation
const schema = {
  type: "object",
  properties: {
    filters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          column: { type: "string" },
          op: { enum: ["=", "!=", ">", "<", ">=", "<=", "in", "between", "contains"] },
          value: {}
        },
        required: ["column", "op", "value"]
      }
    },
    groupby: { type: "array", items: { type: "string" } },
    metrics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          agg: { enum: ["sum", "avg", "min", "max", "count", "count_distinct"] },
          column: { type: "string" },
          alias: { type: "string" }
        },
        required: ["agg", "column"]
      }
    },
    orderBy: {
      type: "array",
      items: {
        type: "object",
        properties: { column: { type: "string" }, desc: { type: "boolean" } },
        required: ["column"]
      }
    },
    limit: { type: "number" },
    suggestedVegaLite: { type: ["object", "null"] }
  },
  additionalProperties: false
};

const ajv = new Ajv();
const validate = ajv.compile(schema);

const ALLOWED_COLS = new Set([
  "GrossQuantity", "FlowRate", "ShipmentCompartmentID", "BaseProductID",
  "BaseProductCode", "ShipmentID", "ShipmentCode", "ExitTime", "BayCode",
  "ScheduledDate", "CreatedTime"
]);

function guardColumns(spec) {
  const cols = [];
  (spec.groupby || []).forEach((c) => cols.push(c));
  (spec.metrics || []).forEach((m) => cols.push(m.column));
  (spec.filters || []).forEach((f) => cols.push(f.column));
  (spec.orderBy || []).forEach((o) => cols.push(o.column));
  return cols.every((c) => ALLOWED_COLS.has(c));
}

app.post("/api/nlq", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("Received query:", prompt);

    // Mock spec that will return data for GraphicWalker
    let spec = {
      groupby: ["BaseProductCode"],
      metrics: [
        { agg: "sum", column: "GrossQuantity", alias: "total_quantity" },
        { agg: "avg", column: "FlowRate", alias: "avg_flow_rate" }
      ],
      orderBy: [{ column: "total_quantity", desc: true }],
      limit: 10,
      suggestedVegaLite: {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Shipment data by product code",
        "mark": "bar",
        "encoding": {
          "x": {"field": "BaseProductCode", "type": "nominal", "title": "Product Code"},
          "y": {"field": "total_quantity", "type": "quantitative", "title": "Total Quantity"}
        }
      }
    };

    // Try Ollama if available
    try {
      const system = `You are a data analyst. Output ONLY valid JSON matching this schema: ${JSON.stringify(schema)}.
Use column names EXACTLY from this list: ${[...ALLOWED_COLS].join(", ")}.`;
      const user = `Dataset: Shipments. Task: ${prompt}. Return suggestedVegaLite when obvious.`;

      const ollamaRes = await fetch(
        process.env.OLLAMA_URL || "http://localhost:11434/api/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: process.env.OLLAMA_MODEL || "llama3.1:8b",
            prompt: `${system}\n\n${user}`,
            options: { temperature: 0.1 },
            stream: false
          })
        }
      );

      if (ollamaRes.ok) {
        const ollamaJson = await ollamaRes.json();
        const ollamaSpec = JSON.parse(ollamaJson.response);
        if (validate(ollamaSpec) && guardColumns(ollamaSpec)) {
          spec = ollamaSpec;
          console.log("✅ Using Ollama response");
        }
      }
    } catch (ollamaError) {
      console.log("⚠️  Ollama not available, using mock data");
    }

    // For demo, return processed data that GraphicWalker can use
    res.json({
      data: processedData,
      suggestedVegaLite: spec.suggestedVegaLite,
      sql: "SELECT BaseProductCode, SUM(GrossQuantity) as total_quantity, AVG(FlowRate) as avg_flow_rate FROM shipments GROUP BY BaseProductCode ORDER BY total_quantity DESC",
      note: "Demo data - install Ollama for AI-powered queries"
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 NLQ server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api/nlq`);
});