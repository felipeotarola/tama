import type {
  ChatRequest,
  ChatResponse,
  PetActionRequest,
  PetActionResponse,
  PetLoadRequest,
  PetLoadResponse,
} from "./api-types";

async function postJson<TResponse>(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "Mileahchi tappade tråden en stund.";

    throw new Error(message);
  }

  return payload as TResponse;
}

export function loadPetProfile(request: PetLoadRequest) {
  return postJson<PetLoadResponse>("/api/pet/load", request);
}

export function savePetAction(request: PetActionRequest) {
  return postJson<PetActionResponse>("/api/pet/action", request);
}

export function sendChatMessage(request: ChatRequest) {
  return postJson<ChatResponse>("/api/chat", request);
}
