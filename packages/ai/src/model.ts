import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV3 } from "@ai-sdk/provider";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY env var is required");
}

const openaiClient = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function createModel(modelId = "gpt-4o-mini"): LanguageModelV3 {
  return openaiClient(modelId) as LanguageModelV3;
}
