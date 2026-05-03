import { applyChatEffect } from "@/lib/ai/companion-effects";
import { generateMileahchiReply } from "@/lib/ai/chat-service";
import {
  CHAT_FALLBACK_RESPONSE,
  hasSeriousSafetySignal,
  repairAssistantResponse,
  TRUSTED_GROWN_UP_RESPONSE,
} from "@/lib/ai/safety";
import { isSupabaseServerConfigured } from "@/lib/supabase/server";
import type {
  ChatMessageDTO,
  ChatResponse,
} from "@/lib/tamagotchi/api-types";
import {
  initialPetState,
  parsePetState,
  type PetState,
} from "@/lib/tamagotchi/pet-state";
import {
  insertChatMessage,
  loadOrCreateGuestPet,
  loadRecentChatMessages,
  updateGuestPet,
  type LoadedPetProfile,
} from "@/lib/tamagotchi/pet-storage";
import { isValidGuestId } from "@/lib/tamagotchi/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readBody(request);
  const guestId = typeof body?.guestId === "string" ? body.guestId : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const clientPet = parsePetState(body?.clientPet) ?? initialPetState;
  const clientMessages = parseClientMessages(body?.clientMessages);

  if (!isValidGuestId(guestId)) {
    return Response.json({ error: "Ogiltig Mileahchi-session." }, { status: 400 });
  }

  if (message.length < 1 || message.length > 280) {
    return Response.json(
      { error: "Skriv ett kort meddelande till Mileahchi." },
      { status: 400 },
    );
  }

  const storageContext = await loadStorageContext(
    guestId,
    clientPet,
    clientMessages,
  );
  const basePet = storageContext.profile?.pet ?? clientPet;

  if (hasSeriousSafetySignal(message)) {
    const messages = await persistChatTurn({
      profile: storageContext.profile,
      existingMessages: storageContext.messages,
      userMessage: message,
      assistantMessage: TRUSTED_GROWN_UP_RESPONSE,
      pet: basePet,
    });

    await persistPet(storageContext.profile, basePet);

    return Response.json({
      pet: basePet,
      message: TRUSTED_GROWN_UP_RESPONSE,
      animation: "sleepy",
      messages,
      storage: storageContext.storage,
      notice: storageContext.notice,
    } satisfies ChatResponse);
  }

  let assistantMessage = CHAT_FALLBACK_RESPONSE;
  let notice = storageContext.notice;

  try {
    assistantMessage = await generateMileahchiReply({
      pet: basePet,
      recentMessages: storageContext.messages,
      userMessage: message,
    });
  } catch (error) {
    console.error("Failed to generate Mileahchi chat response.", error);
    notice = "Mileahchi blev lite sömnig, men samtalet finns kvar här.";
  }

  assistantMessage = repairAssistantResponse(assistantMessage);

  const effect = applyChatEffect(basePet, message);
  const messages = await persistChatTurn({
    profile: storageContext.profile,
    existingMessages: storageContext.messages,
    userMessage: message,
    assistantMessage,
    pet: effect.pet,
  });

  await persistPet(storageContext.profile, effect.pet);

  return Response.json({
    pet: effect.pet,
    message: assistantMessage,
    animation: effect.animation,
    messages,
    storage: storageContext.storage,
    notice,
  } satisfies ChatResponse);
}

async function loadStorageContext(
  guestId: string,
  clientPet: PetState,
  fallbackMessages: ChatMessageDTO[],
) {
  if (!isSupabaseServerConfigured()) {
    return {
      profile: null,
      messages: fallbackMessages,
      storage: "local" as const,
      notice: "Mileahchi sparar på den här enheten just nu.",
    };
  }

  try {
    const profile = await loadOrCreateGuestPet(guestId, clientPet);
    const messages = await loadRecentChatMessages(profile.id);

    return {
      profile,
      messages,
      storage: "supabase" as const,
      notice: undefined,
    };
  } catch (error) {
    console.error("Failed to prepare Mileahchi chat storage.", error);

    return {
      profile: null,
      messages: fallbackMessages,
      storage: "local" as const,
      notice: "Mileahchi sparar lokalt tills molnet vaknar igen.",
    };
  }
}

async function persistPet(profile: LoadedPetProfile | null, pet: PetState) {
  if (!profile) {
    return;
  }

  try {
    await updateGuestPet(profile.id, pet);
  } catch (error) {
    console.error("Failed to persist Mileahchi chat pet state.", error);
  }
}

async function persistChatTurn({
  profile,
  existingMessages,
  userMessage,
  assistantMessage,
  pet,
}: {
  profile: LoadedPetProfile | null;
  existingMessages: ChatMessageDTO[];
  userMessage: string;
  assistantMessage: string;
  pet: PetState;
}) {
  if (!profile) {
    const now = new Date().toISOString();

    return [
      ...existingMessages,
      {
        id: `local-user-${Date.now()}`,
        role: "user" as const,
        content: userMessage,
        createdAt: now,
      },
      {
        id: `local-assistant-${Date.now()}`,
        role: "assistant" as const,
        content: assistantMessage,
        createdAt: now,
      },
    ].slice(-12);
  }

  try {
    const user = await insertChatMessage(profile.id, "user", userMessage, pet);
    const assistant = await insertChatMessage(
      profile.id,
      "assistant",
      assistantMessage,
      pet,
    );

    return [...existingMessages, user, assistant].slice(-12);
  } catch (error) {
    console.error("Failed to persist Mileahchi chat messages.", error);
    return existingMessages;
  }
}

async function readBody(request: Request) {
  return (await request.json().catch(() => null)) as
    | {
        guestId?: unknown;
        message?: unknown;
        clientPet?: unknown;
        clientMessages?: unknown;
      }
    | null;
}

function parseClientMessages(value: unknown): ChatMessageDTO[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const messages: ChatMessageDTO[] = [];

  for (const message of value) {
    if (messages.length >= 10) {
      messages.shift();
    }

    if (!message || typeof message !== "object") {
      continue;
    }

    const candidate = message as Partial<ChatMessageDTO>;

    if (
      typeof candidate.id !== "string" ||
      typeof candidate.content !== "string" ||
      typeof candidate.createdAt !== "string" ||
      (candidate.role !== "user" && candidate.role !== "assistant")
    ) {
      continue;
    }

    messages.push({
      id: candidate.id,
      role: candidate.role,
      content: candidate.content.slice(0, 600),
      createdAt: candidate.createdAt,
    });
  }

  return messages;
}
