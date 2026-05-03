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
  hungry: "Ett mellis snart? Magen småkurrar.",
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
  const hunger = clampStat(pet.stats.hunger + 3);
  const energy = clampStat(pet.stats.energy - 2);
  const happinessLoss = hunger > 72 || energy < 30 ? 3 : 1;

  return normalizePetState({
    hunger,
    energy,
    happiness: pet.stats.happiness - happinessLoss,
  });
}
