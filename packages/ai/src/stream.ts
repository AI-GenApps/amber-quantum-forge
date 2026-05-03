import { type ModelMessage, streamText } from "ai";
import { createModel } from "./model";
import type { StreamOptions } from "./types";

export function streamChat(messages: ModelMessage[], options: StreamOptions = {}) {
  const { model = "gpt-4o-mini", system, temperature = 0.7, maxTokens = 1000 } = options;
  return streamText({
    model: createModel(model),
    messages,
    system,
    temperature,
    maxOutputTokens: maxTokens,
  });
}
