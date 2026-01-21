// Script to check Gemini API quota by making a minimal test request
import { GoogleGenAI } from "@google/genai";
import { config } from "./config/index.js";

async function checkQuota() {
  console.log("=".repeat(50));
  console.log("🔍 Gemini API Quota Check");
  console.log("=".repeat(50));
  console.log("\nAPI Key:", config.geminiApiKey ? "✓ Found" : "✗ Missing");

  if (!config.geminiApiKey) {
    console.log("\n❌ No API key configured. Set GEMINI_API_KEY in .env");
    return;
  }

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

  // Test models to check quota
  const testModels = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
  ];

  console.log("\nTesting models...\n");

  for (const model of testModels) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: "Say 'OK' only",
      });

      const text = response.text?.trim() || "OK";
      console.log(
        `✅ ${model}: Working! Response: ${text.substring(0, 20)}...`,
      );

      // Found a working model, update recommendation
      console.log(`\n🎉 Found working model: ${model}`);
      console.log(`Update gemini.service.ts to use this model.`);
      return;
    } catch (error: any) {
      const status = error.status || error.code;
      const message = error.message || String(error);

      if (
        status === 429 ||
        message.includes("429") ||
        message.includes("quota")
      ) {
        console.log(`❌ ${model}: Quota exceeded`);
      } else if (
        status === 404 ||
        message.includes("404") ||
        message.includes("not found")
      ) {
        console.log(`⚠️  ${model}: Model not available`);
      } else if (status === 400 || message.includes("API_KEY_INVALID")) {
        console.log(`❌ ${model}: Invalid API key`);
        break; // No point testing other models
      } else {
        console.log(`❌ ${model}: Error - ${message.substring(0, 50)}...`);
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary:");
  console.log("=".repeat(50));
  console.log("\nAll models have quota issues. Options:");
  console.log("1. Wait 24h for quota reset");
  console.log("2. Create a new project at https://aistudio.google.com");
  console.log("3. Enable billing for unlimited usage");
}

checkQuota().catch(console.error);
