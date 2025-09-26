// server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import Ajv from "ajv";
import fetch from "node-fetch";
// import * as duckdb from "duckdb"; // Temporarily disabled due to compilation issues
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors()); // Enable CORS for frontend communication
app.use(bodyParser.json({ limit: "2mb" }));

// 1) Mock data for testing (replace with your actual data source)
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

// 2) Strict schema for LLM output
const schema = {
  type: "object",
  properties: {
    filters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          column: { type: "string" },
          op: {
            enum: [
              "=",
              "!=",
              ">",
              "<",
              ">=",
              "<=",
              "in",
              "between",
              "contains",
            ],
          },
          value: {},
        },
        required: ["column", "op", "value"],
      },
    },
    groupby: { type: "array", items: { type: "string" } },
    metrics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          agg: {
            enum: ["sum", "avg", "min", "max", "count", "count_distinct"],
          },
          column: { type: "string" },
          alias: { type: "string" },
        },
        required: ["agg", "column"],
      },
    },
    orderBy: {
      type: "array",
      items: {
        type: "object",
        properties: { column: { type: "string" }, desc: { type: "boolean" } },
        required: ["column"],
      },
    },
    limit: { type: "number" },
    suggestedVegaLite: { type: ["object", "null"] },
  },
  additionalProperties: false,
};
const ajv = new Ajv();
const validate = ajv.compile(schema);

// 3) Column allowlist (prevents prompt-injection shenanigans)
const ALLOWED_COLS = new Set([
  "GrossQuantity",
  "FlowRate",
  "ShipmentCompartmentID",
  "BaseProductID",
  "BaseProductCode",
  "ShipmentID",
  "ShipmentCode",
  "ExitTime",
  "BayCode",
  "ScheduledDate",
  "CreatedTime",
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
  const { prompt } = req.body;

  // 4) Ask Ollama to emit ONLY JSON for our schema
  const system = `You are a data analyst. Output ONLY valid JSON matching this schema: ${JSON.stringify(
    schema
  )}.
Use column names EXACTLY from this list: ${[...ALLOWED_COLS].join(", ")}.`;
  const user = `Dataset: Shipments. Task: ${prompt}. Return suggestedVegaLite when obvious.`;

  const ollamaRes = await fetch(
    process.env.OLLAMA_URL ?? "http://OLLAMA_HOST:11434/api/generate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1:8b", // pick a cloud-hosted model you’ve deployed with Internet access
        prompt: `${system}\n\n${user}`,
        options: { temperature: 0.1 },
        stream: false,
      }),
    }
  );
  const ollamaJson = await ollamaRes.json();
  // Depending on Ollama API, parsed text is in ollamaJson.response
  let spec;
  try {
    spec = JSON.parse(ollamaJson.response);
  } catch {
    return res.status(400).json({ error: "LLM did not return valid JSON" });
  }

  if (!validate(spec) || !guardColumns(spec)) {
    return res
      .status(400)
      .json({ error: "Spec failed validation or used disallowed columns" });
  }

  // 5) Build a safe SQL from the spec (simple builder)
  const selects = [
    ...(spec.groupby || []),
    ...(spec.metrics || []).map((m) => {
      const alias = m.alias || `${m.agg}_${m.column}`;
      const agg =
        m.agg === "count_distinct"
          ? "COUNT(DISTINCT"
          : m.agg.toUpperCase() + "(";
      const aggClose = m.agg === "count_distinct" ? ")" : ")";
      return `${agg}${m.column}${aggClose} AS ${alias}`;
    }),
  ];
  let sql = `SELECT ${selects.join(", ")} FROM shipments`;

  const where = (spec.filters || []).map((f) => {
    if (f.op === "in" && Array.isArray(f.value))
      return `${f.column} IN (${f.value.map((v) => `'${v}'`).join(",")})`;
    if (f.op === "between" && Array.isArray(f.value) && f.value.length === 2)
      return `${f.column} BETWEEN '${f.value[0]}' AND '${f.value[1]}'`;
    if (f.op === "contains")
      return `${f.column} ILIKE '%' || '${String(f.value).replace(
        "'",
        "''"
      )}' || '%'`;
    if (["=", "!=", "<", ">", "<=", ">="].includes(f.op)) {
      const val =
        typeof f.value === "number"
          ? f.value
          : `'${String(f.value).replace("'", "''")}'`;
      return `${f.column} ${f.op} ${val}`;
    }
    return "1=1";
  });
  if (where.length) sql += ` WHERE ${where.join(" AND ")}`;

  if ((spec.groupby || []).length)
    sql += ` GROUP BY ${spec.groupby.join(", ")}`;

  if (spec.orderBy?.length) {
    const parts = spec.orderBy.map(
      (o) => `${o.column} ${o.desc ? "DESC" : "ASC"}`
    );
    sql += ` ORDER BY ${parts.join(", ")}`;
  }
  if (spec.limit) sql += ` LIMIT ${spec.limit}`;

  // For now, return mock data while we test Ollama integration
  // TODO: Replace with actual database query execution
  console.log("Generated SQL:", sql);
  console.log("Spec from Ollama:", JSON.stringify(spec, null, 2));
  
  res.json({
    data: mockShipmentData.slice(0, spec.limit || 10),
    suggestedVegaLite: spec.suggestedVegaLite || null,
    sql,
    note: "Using mock data - replace with actual database query"
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`NLQ server running on :${PORT}`));
