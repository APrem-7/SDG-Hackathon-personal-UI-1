// server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

// Load real shipment data from JSON file
const dataPath = path.join(process.cwd(), 'data.json');
let shipmentData = [];

try {
  console.log('📂 Loading shipment data...');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  shipmentData = rawData.trim().split('\n').map(line => JSON.parse(line));
  console.log(`✅ Loaded ${shipmentData.length} shipment records`);
} catch (error) {
  console.error('❌ Error loading data:', error.message);
  shipmentData = [];
}

app.post("/api/nlq", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("🔍 Query:", prompt);

    if (shipmentData.length === 0) {
      return res.status(500).json({ 
        error: "No data available"
      });
    }

    // Simple data processing based on prompt
    let result = shipmentData.slice(0, 100); // Limit to 100 records for demo
    
    // Basic filtering
    if (prompt.toLowerCase().includes('2017')) {
      result = result.filter(item => item.ExitTime_Year === 2017);
    }
    if (prompt.toLowerCase().includes('2016')) {
      result = result.filter(item => item.ExitTime_Year === 2016);
    }
    
    console.log(`📊 Returning ${result.length} records`);

    res.json({
      data: result,
      note: `Real shipment data - ${result.length} of ${shipmentData.length} records`
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    records: shipmentData.length 
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📈 Loaded ${shipmentData.length} records`);
});
