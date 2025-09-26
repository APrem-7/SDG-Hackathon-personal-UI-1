// server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

// Load real shipment data from JSON file
const dataPath = path.join(process.cwd(), "data.json");
let shipmentData = [];

try {
  console.log(" Loading shipment data...");
  const rawData = fs.readFileSync(dataPath, "utf8");
  shipmentData = rawData
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  console.log(`Loaded ${shipmentData.length} shipment records`);
} catch (error) {
  console.error("Error loading data:", error.message);
  shipmentData = [];
}

// Ollama integration function
async function queryOllama(prompt, context) {
  try {
    const response = await fetch(`${process.env.OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma3:1b", // Using your available model
        prompt: `You are a data visualization expert. Analyze this user query and generate both data filtering and chart configuration.

Available data fields: ${Object.keys(shipmentData[0] || {}).join(", ")}
User query: "${prompt}"

For bar charts, the data will be automatically aggregated by the x-field (grouped and summed).
For questions about "flows by bay code" or similar, use BayCodeID for x-axis and GrossQuantity for y-axis.

Respond with a JSON object containing:
1. Data filtering criteria
2. Chart configuration for automatic visualization

Example response:
{
  "filters": {
    "year": 2017,
    "minQuantity": 1000,
    "productCode": "ABC123"
  },
  "limit": 500,
  "explanation": "Show shipments from 2017 with quantity above 1000",
  "chartConfig": {
    "chartType": "bar",
    "xField": "BayCodeID",
    "yField": "GrossQuantity", 
    "title": "Shipment Flows by Bay Code"
  }
}

Chart types available: bar, line, scatter, pie, area
Field mappings: Use exact field names from available data fields.
For bay code analysis, use BayCodeID as the grouping field.`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Ollama error:", error.message);
    return null;
  }
}

// Generate Vega-Lite specification from chart config
function generateVegaLiteSpec(chartConfig, data) {
  if (!chartConfig || !chartConfig.chartType) return null;

  const baseSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: chartConfig.title || "Chart",
    data: { values: data },
    width: 500,
    height: 350,
  };

  switch (chartConfig.chartType) {
    case "bar":
      return {
        ...baseSpec,
        mark: "bar",
        transform: [
          {
            aggregate: [{ op: "sum", field: chartConfig.yField, as: "total" }],
            groupby: [chartConfig.xField, "BaseProductCode"],
          },
        ],
        encoding: {
          x: {
            field: chartConfig.xField,
            type: "nominal",
            axis: { labelAngle: -45 },
            sort: { field: "total", op: "sum", order: "descending" },
          },
          y: {
            field: "total",
            type: "quantitative",
            title: chartConfig.yField,
          },
          color: {
            field: "BaseProductCode",
            type: "nominal",
            scale: { scheme: "category10" },
            legend: { title: "Product Code" },
          },
        },
      };

    case "line":
      return {
        ...baseSpec,
        mark: "line",
        encoding: {
          x: { field: chartConfig.xField, type: "temporal" },
          y: { field: chartConfig.yField, type: "quantitative" },
          color: {
            field: "BaseProductCode",
            type: "nominal",
            scale: { scheme: "category10" },
            legend: { title: "Product Code" },
          },
        },
      };

    case "scatter":
      return {
        ...baseSpec,
        mark: "circle",
        encoding: {
          x: { field: chartConfig.xField, type: "quantitative" },
          y: { field: chartConfig.yField, type: "quantitative" },
          color: {
            field: "BaseProductCode",
            type: "nominal",
            scale: { scheme: "category10" },
            legend: { title: "Product Code" },
          },
        },
      };

    case "pie":
      return {
        ...baseSpec,
        mark: "arc",
        encoding: {
          theta: { field: chartConfig.yField, type: "quantitative" },
          color: { field: chartConfig.xField, type: "nominal" },
        },
      };

    default:
      return baseSpec;
  }
}

// Apply filters based on Ollama response
function applyFilters(data, filters) {
  let result = [...data];

  if (filters.year) {
    result = result.filter((item) => item.ExitTime_Year === filters.year);
  }
  if (filters.minQuantity) {
    result = result.filter((item) => item.GrossQuantity >= filters.minQuantity);
  }
  if (filters.maxQuantity) {
    result = result.filter((item) => item.GrossQuantity <= filters.maxQuantity);
  }
  if (filters.productCode) {
    result = result.filter(
      (item) =>
        item.BaseProductCode &&
        item.BaseProductCode.includes(filters.productCode)
    );
  }
  if (filters.minFlowRate) {
    result = result.filter((item) => item.FlowRate >= filters.minFlowRate);
  }

  return result.slice(0, filters.limit || 100);
}

app.post("/api/nlq", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("Query:", prompt);

    if (shipmentData.length === 0) {
      return res.status(500).json({
        error: "No data available",
      });
    }

    let result = [];
    let explanation = "Basic filtering applied";
    let chartSpec = null;

    // Try Ollama first
    console.log("Querying Ollama...");
    const ollamaResponse = await queryOllama(prompt, shipmentData.slice(0, 5));

    if (ollamaResponse) {
      try {
        // Try to parse Ollama's JSON response
        const responseMatch = ollamaResponse.match(/\{[\s\S]*\}/);
        if (responseMatch) {
          const aiInstructions = JSON.parse(responseMatch[0]);
          console.log(" AI Instructions:", aiInstructions);

          if (aiInstructions.filters) {
            result = applyFilters(shipmentData, aiInstructions.filters);
            explanation =
              aiInstructions.explanation || "AI-powered filtering applied";
          }

          // Generate chart specification if requested
          if (aiInstructions.chartConfig && result.length > 0) {
            chartSpec = generateVegaLiteSpec(
              aiInstructions.chartConfig,
              result.slice(0, 50)
            );
            console.log("Generated chart spec:", aiInstructions.chartConfig);
          }
        }
      } catch (parseError) {
        console.log(" Could not parse AI response, using fallback");
      }
    }

    // Fallback to simple filtering if Ollama fails
    if (result.length === 0) {
      console.log("Using fallback filtering");
      result = shipmentData.slice(0, 100);

      // Basic keyword filtering
      const lowerPrompt = prompt.toLowerCase();
      if (lowerPrompt.includes("2017")) {
        result = result.filter((item) => item.ExitTime_Year === 2017);
        explanation = "Filtered by year 2017";
      }
      if (lowerPrompt.includes("2016")) {
        result = result.filter((item) => item.ExitTime_Year === 2016);
        explanation = "Filtered by year 2016";
      }
      if (
        lowerPrompt.includes("high flow") ||
        lowerPrompt.includes("high rate")
      ) {
        result = result.filter((item) => item.FlowRate > 50);
        explanation = "Filtered by high flow rate";
      }
    }

    console.log(` Returning ${result.length} records`);

    let chartConfig = null;

    // Extract chartConfig from AI response for frontend
    if (ollamaResponse) {
      try {
        const responseMatch = ollamaResponse.match(/\{[\s\S]*\}/);
        if (responseMatch) {
          const aiInstructions = JSON.parse(responseMatch[0]);
          chartConfig = aiInstructions.chartConfig;
        }
      } catch (parseError) {
        console.log(" Could not extract chart config");
      }
    }

    res.json({
      data: result,
      explanation: explanation,
      note: `Shipment data - ${result.length} of ${shipmentData.length} records`,
      aiPowered: ollamaResponse ? true : false,
      chartSpec: chartSpec,
      chartConfig: chartConfig,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    records: shipmentData.length,
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(`Loaded ${shipmentData.length} records`);
});
