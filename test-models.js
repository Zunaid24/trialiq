import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const response = await ai.models.generateContent({
  model: "gemini-3.5-flash",
  contents: "Reply with ONLY the word OK",
});

console.log(response);
console.log("TEXT:", response.text);
console.log("TEXT():", typeof response.text === "function" ? await response.text() : response.text);