import type { SpriteAnimationName } from "./animation-data";

export type PetMood = "idle" | "happy" | "hungry" | "sleepy" | "playful";

export type PetStats = {
  hunger: number;
  energy: number;
  happiness: number;
};

export type PetState = {
  stats: PetStats;
  mood: PetMood;
};

export type PetActionName = "feed" | "play" | "sleep" | "hug";

export type PetActionDefinition = {
  name: PetActionName;
  label: string;
  emoji: string;
  message: string;
  animation: SpriteAnimationName;
  delta: PetStats;
};

export type PetActionResult = {
  pet: PetState;
  message: string;
  animation: SpriteAnimationName;
};

export const PET_DECAY_INTERVAL_MS = 12_000;
export const PET_STATE_STORAGE_KEY = "mileahchi.pet-state.v2";
const PET_STATE_STORAGE_VERSION = 1;

export const initialPetState: PetState = {
  stats: {
    hunger: 26,
    energy: 68,
    happiness: 82,
  },
  mood: "idle",
};

export const PET_ACTIONS: PetActionDefinition[] = [
  {
    name: "feed",
    label: "Mata",
    emoji: "🍎",
    message: "Äppelknaster. Magen känns solvarm.",
    animation: "happy",
    delta: { hunger: -30, energy: 3, happiness: 8 },
  },
  {
    name: "play",
    label: "Lek",
    emoji: "🎲",
    message: "Igen, igen! Jag hittade fnisset.",
    animation: "playful",
    delta: { hunger: 10, energy: -16, happiness: 20 },
  },
  {
    name: "sleep",
    label: "Sov",
    emoji: "🌙",
    message: "Stoppa om mig under månfilten.",
    animation: "sleepy",
    delta: { hunger: 5, energy: 34, happiness: 5 },
  },
  {
    name: "hug",
    label: "Kram",
    emoji: "🤗",
    message: "Den kramen fick hjärtat att glöda.",
    animation: "happy",
    delta: { hunger: 1, energy: 4, happiness: 16 },
  },
];

export const moodMessages: Record<PetMood, string> = {
  idle: "Jag sparade ett mjukt litet löv åt dig.",
  happy: "Hjärtat känns alldeles glittrigt nu.",
  hungry: "Magen kurrar. Finns det ett mellis?",
  sleepy: "Ögonlocken blir till små moln.",
  playful: "Vi leker tills skogen fnissar.",
};

export const clampStat = (value: number) => Math.min(100, Math.max(0, value));

export const getFullness = (stats: PetStats) => 100 - stats.hunger;

export function deriveMood(stats: PetStats): PetMood {
  if (stats.energy <= 28) {
    return "sleepy";
  }

  if (stats.hunger >= 74) {
    return "hungry";
  }

  if (stats.happiness >= 90 && stats.hunger <= 60 && stats.energy >= 38) {
    return "happy";
  }

  return "idle";
}

export function normalizePetState(stats: PetStats): PetState {
  const normalizedStats = {
    hunger: clampStat(stats.hunger),
    energy: clampStat(stats.energy),
    happiness: clampStat(stats.happiness),
  };

  return {
    stats: normalizedStats,
    mood: deriveMood(normalizedStats),
  };
}

export function applyPetAction(
  pet: PetState,
  actionName: PetActionName,
): PetActionResult {
  const action = PET_ACTIONS.find((item) => item.name === actionName);

  if (!action) {
    return {
      pet,
      message: moodMessages[pet.mood],
      animation: "idle",
    };
  }

  const nextPet = normalizePetState({
    hunger: pet.stats.hunger + action.delta.hunger,
    energy: pet.stats.energy + action.delta.energy,
    happiness: pet.stats.happiness + action.delta.happiness,
  });

  return {
    pet: nextPet,
    message: action.message,
    animation: action.animation,
  };
}

export function decayPetState(pet: PetState): PetState {
  const hunger = clampStat(pet.stats.hunger + 2);
  const energy = clampStat(pet.stats.energy - 2);
  const happinessLoss = hunger > 72 || energy < 30 ? 3 : 1;

  return normalizePetState({
    hunger,
    energy,
    happiness: pet.stats.happiness - happinessLoss,
  });
}

export function advancePetState(
  pet: PetState,
  steps: number,
  maxSteps = 48,
): PetState {
  const safeSteps = Math.min(Math.max(0, Math.floor(steps)), maxSteps);
  let nextPet = pet;

  for (let step = 0; step < safeSteps; step += 1) {
    nextPet = decayPetState(nextPet);
  }

  return nextPet;
}

export function serializePetState(pet: PetState, savedAt = Date.now()) {
  return JSON.stringify({
    version: PET_STATE_STORAGE_VERSION,
    savedAt,
    pet,
  });
}

export function restorePetState(
  rawValue: string | null,
  now = Date.now(),
): PetState | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);

    if (!isStoredPetState(parsed)) {
      return null;
    }

    const restoredPet = normalizePetState(parsed.pet.stats);
    const elapsedSteps = Math.floor(
      Math.max(0, now - parsed.savedAt) / PET_DECAY_INTERVAL_MS,
    );

    return advancePetState(restoredPet, elapsedSteps);
  } catch {
    return null;
  }
}

function isStoredPetState(value: unknown): value is {
  version: number;
  savedAt: number;
  pet: PetState;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    version?: unknown;
    savedAt?: unknown;
    pet?: {
      stats?: Partial<Record<keyof PetStats, unknown>>;
    };
  };

  return (
    candidate.version === PET_STATE_STORAGE_VERSION &&
    typeof candidate.savedAt === "number" &&
    typeof candidate.pet?.stats?.hunger === "number" &&
    typeof candidate.pet.stats.energy === "number" &&
    typeof candidate.pet.stats.happiness === "number"
  );
}
