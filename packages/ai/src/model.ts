import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV3 } from "@ai-sdk/provider";

export function createModel(modelId = "gpt-4o-mini"): LanguageModelV3 {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY env var is required");
  }

  const openaiClient = createOpenAI({
    apiKey,
  });

  return openaiClient(modelId) as LanguageModelV3;
}
