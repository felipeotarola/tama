import { supabaseRest } from "@/lib/supabase/server";

import type { ChatMessageDTO } from "./api-types";
import {
  advancePetState,
  initialPetState,
  normalizePetState,
  PET_DECAY_INTERVAL_MS,
  type PetActionName,
  type PetState,
} from "./pet-state";
import { isValidGuestId } from "./session";

type PetProfileRow = {
  id: string;
  user_id: string | null;
  guest_id: string | null;
  name: string;
  hunger: number;
  energy: number;
  happiness: number;
  mood: string;
  last_interaction_at: string;
  created_at: string;
  updated_at: string;
};

type ChatMessageRow = {
  id: string;
  role: ChatMessageDTO["role"];
  content: string;
  created_at: string;
};

type PetMemoryRow = {
  id: string;
  content: string;
};

type PersistedGameState = Pick<PetState, "progress" | "actionMemory">;

export type LoadedPetProfile = {
  id: string;
  pet: PetState;
};

const PET_PROFILE_SELECT =
  "id,user_id,guest_id,name,hunger,energy,happiness,mood,last_interaction_at,created_at,updated_at";

export async function loadOrCreateGuestPet(
  guestId: string,
  fallbackPet: PetState = initialPetState,
): Promise<LoadedPetProfile> {
  assertGuestId(guestId);

  const rows = await supabaseRest<PetProfileRow[]>(
    `pet_profiles?select=${PET_PROFILE_SELECT}&guest_id=eq.${encodeURIComponent(
      guestId,
    )}&order=created_at.asc&limit=1`,
  );
  const existingPet = rows[0];

  if (existingPet) {
    const gameState = await loadPetGameState(existingPet.id).catch(() => null);
    const pet = applyElapsedDecay(existingPet, fallbackPet, gameState);
    await updateGuestPet(existingPet.id, pet);
    return { id: existingPet.id, pet };
  }

  const insertedRows = await supabaseRest<PetProfileRow[]>("pet_profiles", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify({
      guest_id: guestId,
      name: "Mileahchi",
      hunger: fallbackPet.stats.hunger,
      energy: fallbackPet.stats.energy,
      happiness: fallbackPet.stats.happiness,
      mood: fallbackPet.mood,
      last_interaction_at: new Date().toISOString(),
    }),
  });
  const insertedPet = insertedRows[0];
  const pet = rowToPetState(insertedPet, fallbackPet, {
    progress: fallbackPet.progress,
    actionMemory: fallbackPet.actionMemory,
  });

  await savePetGameState(insertedPet.id, pet).catch((error) => {
    console.error("Failed to create Mileahchi game memory.", error);
  });

  return {
    id: insertedPet.id,
    pet,
  };
}

export async function updateGuestPet(petId: string, pet: PetState) {
  await supabaseRest<PetProfileRow[]>(
    `pet_profiles?id=eq.${encodeURIComponent(petId)}`,
    {
      method: "PATCH",
      prefer: "return=representation",
      body: JSON.stringify({
        hunger: pet.stats.hunger,
        energy: pet.stats.energy,
        happiness: pet.stats.happiness,
        mood: pet.mood,
        last_interaction_at: new Date().toISOString(),
      }),
    },
  );

  await savePetGameState(petId, pet).catch((error) => {
    console.error("Failed to save Mileahchi game memory.", error);
  });
}

export async function insertPetEvent(
  petId: string,
  eventType: PetActionName | "chat",
  statDelta: Record<string, number>,
  message: string,
  xpGained = 0,
) {
  await supabaseRest("pet_events", {
    method: "POST",
    body: JSON.stringify({
      pet_id: petId,
      event_type: eventType,
      stat_delta: {
        ...statDelta,
        xp: xpGained,
      },
      message,
    }),
  });
}

export async function loadRecentChatMessages(petId: string, limit = 12) {
  const rows = await supabaseRest<ChatMessageRow[]>(
    `chat_messages?select=id,role,content,created_at&pet_id=eq.${encodeURIComponent(
      petId,
    )}&order=created_at.desc&limit=${limit}`,
  );

  return rows.reverse().map(rowToChatMessage);
}

export async function insertChatMessage(
  petId: string,
  role: ChatMessageDTO["role"],
  content: string,
  pet: PetState,
) {
  const rows = await supabaseRest<ChatMessageRow[]>("chat_messages", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify({
      pet_id: petId,
      role,
      content,
      mood_snapshot: pet.mood,
      stats_snapshot: pet.stats,
    }),
  });

  return rowToChatMessage(rows[0]);
}

function assertGuestId(guestId: string) {
  if (!isValidGuestId(guestId)) {
    throw new Error("Invalid guest session.");
  }
}

async function loadPetGameState(petId: string) {
  const rows = await supabaseRest<PetMemoryRow[]>(
    `pet_memories?select=id,content&pet_id=eq.${encodeURIComponent(
      petId,
    )}&memory_type=eq.game_state&order=updated_at.desc&limit=1`,
  );
  const memory = rows[0];

  if (!memory) {
    return null;
  }

  try {
    return JSON.parse(memory.content) as PersistedGameState;
  } catch {
    return null;
  }
}

async function savePetGameState(petId: string, pet: PetState) {
  const content = JSON.stringify({
    progress: pet.progress,
    actionMemory: pet.actionMemory,
  } satisfies PersistedGameState);
  const existingRows = await supabaseRest<PetMemoryRow[]>(
    `pet_memories?select=id,content&pet_id=eq.${encodeURIComponent(
      petId,
    )}&memory_type=eq.game_state&order=updated_at.desc&limit=1`,
  );
  const existingMemory = existingRows[0];

  if (existingMemory) {
    await supabaseRest(`pet_memories?id=eq.${encodeURIComponent(existingMemory.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ content, importance: 1 }),
    });
    return;
  }

  await supabaseRest("pet_memories", {
    method: "POST",
    body: JSON.stringify({
      pet_id: petId,
      memory_type: "game_state",
      content,
      importance: 1,
    }),
  });
}

function rowToPetState(
  row: PetProfileRow,
  fallbackPet: PetState,
  gameState: PersistedGameState | null,
) {
  return normalizePetState(
    {
      hunger: row.hunger,
      energy: row.energy,
      happiness: row.happiness,
    },
    gameState?.progress ?? fallbackPet.progress,
    gameState?.actionMemory ?? fallbackPet.actionMemory,
  );
}

function applyElapsedDecay(
  row: PetProfileRow,
  fallbackPet: PetState,
  gameState: PersistedGameState | null,
) {
  const restoredPet = rowToPetState(row, fallbackPet, gameState);
  const savedAt = new Date(row.last_interaction_at).getTime();
  const elapsedSteps = Number.isFinite(savedAt)
    ? Math.floor(Math.max(0, Date.now() - savedAt) / PET_DECAY_INTERVAL_MS)
    : 0;

  return advancePetState(restoredPet, elapsedSteps);
}

function rowToChatMessage(row: ChatMessageRow): ChatMessageDTO {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}
