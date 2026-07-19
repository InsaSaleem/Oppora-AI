import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(request: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key is missing" }, { status: 500 });
    }

    const { skills, profileContext, opportunities } = await request.json();

    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json([]);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `
      You are an expert career counselor AI.
      Analyze the following User Profile and Job Opportunities.
      
      User Profile Context:
      ${profileContext}

      User Skills: [${skills?.join(", ") || "None listed"}]

      Job Opportunities:
      ${JSON.stringify(opportunities.map((o: any) => ({
        id: o.id,
        title: o.title,
        type: o.type,
        Job_Requirements: o.required_skills,
        description: o.description
      })))}

      INSTRUCTIONS FOR EACH JOB OPPORTUNITY:
      Based on the exact overlap between the 'User Skills' and the 'Job Requirements', calculate a match percentage (0-100 score). You may factor in the User Profile Context (Education, CGPA, Experience) as secondary weighting, but the core score must reflect the skill overlap.
      Provide a short, constructive insight as the 'reason' explaining exactly why the match percentage was given (e.g. "Your background in Python and SQL perfectly aligns with their Data Pipeline needs").

      Return a strictly structured JSON array. Do not include markdown formatting or labels.
      Each object in the array MUST have:
      - "opportunity_id": (string) matching the opportunity ID
      - "score": (number) match percentage
      - "reason": (string) short constructive insight

      Output only the JSON array.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Find array structure in case of leading/trailing text
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Could not parse JSON array from Gemini response");

    const parsed = JSON.parse(match[0]);
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Recommendations generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate recommendations" }, { status: 500 });
  }
}
