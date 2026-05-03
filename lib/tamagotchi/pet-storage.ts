import { supabaseRest } from "@/lib/supabase/server";

import type { ChatMessageDTO } from "./api-types";
import {
  advancePetActivity,
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
  current_scene?: PetState["scene"];
  current_outfit?: PetState["outfit"];
  activity?: PetState["activity"];
  last_decay_at?: string;
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

type PersistedGameState = Pick<
  PetState,
  "progress" | "actionMemory" | "scene" | "outfit" | "activity" | "lastDecayAt"
>;

export type LoadedPetProfile = {
  id: string;
  pet: PetState;
};

const PET_PROFILE_SELECT =
  "id,user_id,guest_id,name,hunger,energy,happiness,mood,current_scene,current_outfit,activity,last_decay_at,last_interaction_at,created_at,updated_at";
const LEGACY_PET_PROFILE_SELECT =
  "id,user_id,guest_id,name,hunger,energy,happiness,mood,last_interaction_at,created_at,updated_at";

export async function loadOrCreateGuestPet(
  guestId: string,
  fallbackPet: PetState = initialPetState,
): Promise<LoadedPetProfile> {
  assertGuestId(guestId);

  const rows = await loadGuestPetRows(guestId);
  const existingPet = rows[0];

  if (existingPet) {
    const gameState = await loadPetGameState(existingPet.id).catch(() => null);
    const pet = applyElapsedDecay(existingPet, fallbackPet, gameState);
    await updateGuestPet(existingPet.id, pet);
    return { id: existingPet.id, pet };
  }

  const insertedRows = await insertGuestPet({
    guest_id: guestId,
    name: "Mileahchi",
    hunger: fallbackPet.stats.hunger,
    energy: fallbackPet.stats.energy,
    happiness: fallbackPet.stats.happiness,
    mood: fallbackPet.mood,
    current_scene: fallbackPet.scene,
    current_outfit: fallbackPet.outfit,
    activity: fallbackPet.activity,
    last_decay_at: new Date(fallbackPet.lastDecayAt).toISOString(),
    last_interaction_at: new Date().toISOString(),
  });
  const insertedPet = insertedRows[0];
  const pet = rowToPetState(insertedPet, fallbackPet, {
    progress: fallbackPet.progress,
    actionMemory: fallbackPet.actionMemory,
    scene: fallbackPet.scene,
    outfit: fallbackPet.outfit,
    activity: fallbackPet.activity,
    lastDecayAt: fallbackPet.lastDecayAt,
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
  await patchGuestPet(petId, {
    hunger: pet.stats.hunger,
    energy: pet.stats.energy,
    happiness: pet.stats.happiness,
    mood: pet.mood,
    current_scene: pet.scene,
    current_outfit: pet.outfit,
    activity: pet.activity,
    last_decay_at: new Date(pet.lastDecayAt).toISOString(),
    last_interaction_at: new Date().toISOString(),
  });

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

async function loadGuestPetRows(guestId: string) {
  const encodedGuestId = encodeURIComponent(guestId);
  const suffix = `&guest_id=eq.${encodedGuestId}&order=created_at.asc&limit=1`;

  try {
    return await supabaseRest<PetProfileRow[]>(
      `pet_profiles?select=${PET_PROFILE_SELECT}${suffix}`,
    );
  } catch (error) {
    console.warn("Falling back to legacy Mileahchi pet profile select.", error);
    return supabaseRest<PetProfileRow[]>(
      `pet_profiles?select=${LEGACY_PET_PROFILE_SELECT}${suffix}`,
    );
  }
}

async function insertGuestPet(body: Record<string, unknown>) {
  try {
    return await supabaseRest<PetProfileRow[]>("pet_profiles", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.warn("Falling back to legacy Mileahchi pet profile insert.", error);
    return supabaseRest<PetProfileRow[]>("pet_profiles", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify(toLegacyPetProfileBody(body)),
    });
  }
}

async function patchGuestPet(petId: string, body: Record<string, unknown>) {
  const path = `pet_profiles?id=eq.${encodeURIComponent(petId)}`;

  try {
    await supabaseRest<PetProfileRow[]>(path, {
      method: "PATCH",
      prefer: "return=representation",
      body: JSON.stringify(body),
    });
    return;
  } catch (error) {
    console.warn("Falling back to legacy Mileahchi pet profile update.", error);
  }

  await supabaseRest<PetProfileRow[]>(path, {
    method: "PATCH",
    prefer: "return=representation",
    body: JSON.stringify(toLegacyPetProfileBody(body)),
  });
}

function toLegacyPetProfileBody(body: Record<string, unknown>) {
  const legacyBody = { ...body };

  delete legacyBody.current_scene;
  delete legacyBody.current_outfit;
  delete legacyBody.activity;
  delete legacyBody.last_decay_at;

  return legacyBody;
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
    scene: pet.scene,
    outfit: pet.outfit,
    activity: pet.activity,
    lastDecayAt: pet.lastDecayAt,
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
    {
      scene: gameState?.scene ?? row.current_scene ?? fallbackPet.scene,
      outfit: gameState?.outfit ?? row.current_outfit ?? fallbackPet.outfit,
      activity: gameState?.activity ?? row.activity ?? fallbackPet.activity,
      lastDecayAt:
        gameState?.lastDecayAt ??
        (row.last_decay_at ? new Date(row.last_decay_at).getTime() : undefined) ??
        fallbackPet.lastDecayAt,
    },
  );
}

function applyElapsedDecay(
  row: PetProfileRow,
  fallbackPet: PetState,
  gameState: PersistedGameState | null,
) {
  const restoredPet = rowToPetState(row, fallbackPet, gameState);
  const now = Date.now();
  const activityAwarePet = advancePetActivity(restoredPet, now);
  const savedAt = new Date(row.last_interaction_at).getTime();
  const decayStart = restoredPet.activity
    ? Math.max(savedAt, restoredPet.activity.endsAt)
    : savedAt;
  const elapsedSteps = Number.isFinite(savedAt)
    ? Math.floor(Math.max(0, now - decayStart) / PET_DECAY_INTERVAL_MS)
    : 0;

  return advancePetState(activityAwarePet, elapsedSteps);
}

function rowToChatMessage(row: ChatMessageRow): ChatMessageDTO {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}
