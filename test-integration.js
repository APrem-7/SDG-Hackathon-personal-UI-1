#!/usr/bin/env node

import fetch from "node-fetch";

async function testIntegration() {
  console.log("🧪 Testing Ollama Integration...\n");

  // Test 1: Health Check
  console.log("1. Testing health endpoint...");
  try {
    const healthResponse = await fetch("http://localhost:3001/api/health");
    const healthData = await healthResponse.json();
    console.log("✅ Health check passed:", healthData);
  } catch (error) {
    console.log("❌ Health check failed:", error.message);
    return;
  }

  // Test 2: NLQ Endpoint (will fail without Ollama running, but we can test the endpoint)
  console.log("\n2. Testing NLQ endpoint...");
  try {
    const nlqResponse = await fetch("http://localhost:3001/api/nlq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "show me the top 5 shipments by gross quantity",
      }),
    });

    if (nlqResponse.ok) {
      const nlqData = await nlqResponse.json();
      console.log("✅ NLQ endpoint responded:", nlqData.note || "Success");
      console.log(
        "📊 Sample data returned:",
        nlqData.data?.length || 0,
        "records"
      );
    } else {
      const errorText = await nlqResponse.text();
      console.log(
        "⚠️  NLQ endpoint error (expected if Ollama not running):",
        nlqResponse.status
      );
      console.log("Error details:", errorText.slice(0, 200) + "...");
    }
  } catch (error) {
    console.log("❌ NLQ endpoint failed:", error.message);
  }

  console.log("\n🎯 Integration Setup Complete!");
  console.log("Frontend: http://localhost:3002");
  console.log("Backend:  http://localhost:3001");
  console.log("\n📝 Next steps:");
  console.log("1. Install Ollama: https://ollama.ai/");
  console.log("2. Pull a model: ollama pull llama3.1:8b");
  console.log("3. Test your app at http://localhost:3002");
}

testIntegration();
