// src/api/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini AI Helper with Model Fallback
 * @param {string} apiKey
 * @param {string} prompt
 * @param {string} systemInstruction
 * @returns {Promise<string>}
 */
export const getAIHelp = async (
  apiKey,
  prompt,
  systemInstruction = "Answer in professional Urdu for a book writer."
) => {
  if (!apiKey) {
    return "❌ API Key missing! Please add VITE_GEMINI_API_KEY in your .env file.";
  }

  if (!prompt || !prompt.trim()) {
    return "براہ کرم سوال لکھیں۔";
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // ✅ Model fallback list (try one by one)
  const MODEL_FALLBACKS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];

  let lastError = null;

  for (const modelName of MODEL_FALLBACKS) {
    try {
      console.log(`🔁 Trying Gemini model: ${modelName}`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });

      const result = await model.generateContent(prompt);

      const text = result?.response?.text?.();

      if (text && text.trim()) {
        console.log(`✅ Success with model: ${modelName}`);
        return text.trim();
      }
    } catch (err) {
      lastError = err;
      console.warn(`❌ Model failed: ${modelName}`, err?.message || err);

      // If model not found / not supported => continue to next model
      continue;
    }
  }

  // If all models fail
  return `معذرت! AI سے جواب نہیں آ سکا۔  
Reason: ${lastError?.message || "All models failed"}`;
};
