import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

// Load from .env.local
const env = fs.readFileSync(".env.local", "utf-8");
const match = env.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : "";

if (!apiKey) {
  console.log("No API key found in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log("Available Models:");
    if (data.models) {
      data.models.forEach((m: any) => {
        if (m.supportedGenerationMethods.includes("generateContent")) {
          console.log(`- ${m.name.replace('models/', '')}`);
        }
      });
    } else {
      console.log(data);
    }
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}

listModels();
