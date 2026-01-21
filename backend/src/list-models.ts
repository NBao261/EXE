// Script to list available Gemini models
import { GoogleGenAI } from "@google/genai";
import { config } from "./config/index.js";

async function listModels() {
  console.log("API Key:", config.geminiApiKey ? "Found" : "Missing");

  try {
    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

    // List models - collect all first
    const modelsList: string[] = [];
    const models = await ai.models.list();

    for await (const model of models) {
      if (model.name) {
        modelsList.push(model.name);
      }
    }

    console.log("\nTotal models:", modelsList.length);
    console.log("\nModels for generateContent:");
    modelsList
      .filter((m) => m.includes("gemini"))
      .forEach((m) => console.log("-", m));
  } catch (error: any) {
    console.error("Error:", error.message || error);
  }
}

listModels();
