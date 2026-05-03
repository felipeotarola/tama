import type { ChatMessageDTO } from "@/lib/tamagotchi/api-types";
import type { PetState } from "@/lib/tamagotchi/pet-state";

import { buildMileahchiSystemPrompt } from "./mileahchi-system-prompt";
import {
  limitAssistantResponse,
  repairAssistantResponse,
} from "./safety";

type GenerateReplyInput = {
  pet: PetState;
  recentMessages: ChatMessageDTO[];
  userMessage: string;
};

type OpenAIResponsePayload = {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      text?: unknown;
      type?: string;
    }>;
  }>;
};

export async function generateMileahchiReply({
  pet,
  recentMessages,
  userMessage,
}: GenerateReplyInput) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      instructions: buildMileahchiSystemPrompt(pet),
      input: [
        ...recentMessages
          .filter((message) => message.role === "user" || message.role === "assistant")
          .slice(-12)
          .map((message) => ({
            role: message.role,
            content: message.content,
          })),
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_output_tokens: 120,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as OpenAIResponsePayload;
  const text = extractResponseText(payload);

  return limitAssistantResponse(repairAssistantResponse(text));
}

function extractResponseText(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  for (const output of payload.output ?? []) {
    for (const content of output.content ?? []) {
      if (typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}
