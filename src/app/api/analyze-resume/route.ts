import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Safeguard against missing API key
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(request: Request) {
  try {
    // 1. API Key check
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key is not configured in .env.local" }, { status: 500 });
    }

    const { resumeText, targetRole } = await request.json();

    if (!resumeText) {
      return NextResponse.json({ error: "resumeText is required" }, { status: 400 });
    }

    // 2. Updated model name to 'gemini-3.5-flash' based on your API key permissions
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `
      Analyze the following resume text for the target role of "${targetRole || 'General Professional'}".
      Provide a strictly structured JSON response. Do not include any formatting like markdown blockticks or "json" label, just raw JSON.
      
      JSON Schema required:
      {
        "score": 85, (A number from 0 to 100 indicating the overall match and quality)
        "summary": "Brief summary text...",
        "strengths": ["strength 1", "strength 2"],
        "improvements": ["improvement 1", "improvement 2"],
        "keywordMatch": ["keyword 1", "keyword 2"]
      }

      Resume Text:
      ${resumeText}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up potential markdown formatting around JSON (just in case)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Resume analysis error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze resume" }, { status: 500 });
  }
}