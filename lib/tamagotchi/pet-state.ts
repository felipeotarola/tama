import type { SpriteAnimationName } from "./animation-data";

export type PetMood = "idle" | "happy" | "hungry" | "sleepy" | "playful";

export type PetStats = {
  hunger: number;
  energy: number;
  happiness: number;
};

export type PetProgress = {
  level: number;
  xp: number;
};

export type PetActionName = "feed" | "play" | "sleep" | "hug";

export type PetActionMemoryEntry = {
  lastUsedAt: number;
  repeatCount: number;
  cooldownUntil: number;
};

export type PetActionMemory = Partial<
  Record<PetActionName, PetActionMemoryEntry>
>;

export type PetState = {
  stats: PetStats;
  mood: PetMood;
  progress: PetProgress;
  actionMemory: PetActionMemory;
};

export type PetActionDefinition = {
  name: PetActionName;
  label: string;
  emoji: string;
  message: string;
  repeatMessage: string;
  cooldownMessage: string;
  lowEnergyMessage?: string;
  animation: SpriteAnimationName;
  delta: PetStats;
  cooldownMs: number;
  xp: number;
};

export type PetActionResult = {
  pet: PetState;
  message: string;
  animation: SpriteAnimationName;
  statDelta: PetStats;
  xpGained: number;
  leveledUp: boolean;
  accepted: boolean;
  cooldownRemainingMs: number;
};

export type PetTiers = {
  hunger: "hungry" | "okay" | "full";
  energy: "tired" | "okay" | "energized";
  happiness: "low" | "calm" | "happy" | "glittery";
};

export const PET_DECAY_INTERVAL_MS = 5 * 60_000;
export const PET_STATE_STORAGE_KEY = "mileahchi.pet-state.v2";
export const ACTION_DIMINISHING_WINDOW_MS = 4 * 60_000;

const PET_STATE_STORAGE_VERSION = 2;
const MAX_OFFLINE_DECAY_STEPS = 288;

const initialProgress: PetProgress = {
  level: 1,
  xp: 0,
};

export const initialPetState: PetState = {
  stats: {
    hunger: 24,
    energy: 70,
    happiness: 76,
  },
  mood: "idle",
  progress: initialProgress,
  actionMemory: {},
};

export const PET_ACTIONS: PetActionDefinition[] = [
  {
    name: "feed",
    label: "Mata",
    emoji: "🍎",
    message: "Äppelknaster. Magen känns solvarm.",
    repeatMessage: "Jag är nästan mätt, men tack för den lilla biten.",
    cooldownMessage: "Magen vill smälta lite först.",
    animation: "happy",
    delta: { hunger: -18, energy: 2, happiness: 5 },
    cooldownMs: 35_000,
    xp: 8,
  },
  {
    name: "play",
    label: "Lek",
    emoji: "🎲",
    message: "Igen, igen! Jag hittade fnisset.",
    repeatMessage: "Vi leker lugnare nu, så orken räcker längre.",
    cooldownMessage: "Jag hämtar andan innan nästa lek.",
    lowEnergyMessage: "Jag vill leka, men tassarna är lite trötta.",
    animation: "playful",
    delta: { hunger: 7, energy: -13, happiness: 14 },
    cooldownMs: 55_000,
    xp: 12,
  },
  {
    name: "sleep",
    label: "Sov",
    emoji: "🌙",
    message: "Stoppa om mig under månfilten.",
    repeatMessage: "En liten extra vila räcker fint.",
    cooldownMessage: "Jag vaknar snart, mjukt och försiktigt.",
    animation: "sleepy",
    delta: { hunger: 3, energy: 20, happiness: 3 },
    cooldownMs: 140_000,
    xp: 10,
  },
  {
    name: "hug",
    label: "Kram",
    emoji: "🤗",
    message: "Den kramen fick hjärtat att glöda.",
    repeatMessage: "Mysig minikram. Hjärtat blinkar lite.",
    cooldownMessage: "Kramvärmen sitter kvar en stund.",
    animation: "happy",
    delta: { hunger: 0, energy: 1, happiness: 8 },
    cooldownMs: 18_000,
    xp: 6,
  },
];

export const moodMessages: Record<PetMood, string> = {
  idle: "Jag sparade ett mjukt litet löv åt dig.",
  happy: "Hjärtat känns alldeles glittrigt nu.",
  hungry: "Jag är lite hungrig... kanske något gott?",
  sleepy: "Jag är trött... vill du vila med mig?",
  playful: "Kom igen, vi leker!",
};

export const clampStat = (value: number) => Math.min(100, Math.max(0, value));

export const getFullness = (stats: PetStats) => 100 - stats.hunger;

export function getXpToNextLevel(level: number) {
  return 80 + Math.max(0, level - 1) * 36;
}

export function getLevelProgress(progress: PetProgress) {
  const xpToNextLevel = getXpToNextLevel(progress.level);

  return {
    level: progress.level,
    xp: progress.xp,
    xpToNextLevel,
    percent: Math.round((progress.xp / xpToNextLevel) * 100),
  };
}

export function deriveTiers(stats: PetStats): PetTiers {
  return {
    hunger:
      stats.hunger >= 70 ? "hungry" : stats.hunger <= 28 ? "full" : "okay",
    energy:
      stats.energy <= 28
        ? "tired"
        : stats.energy >= 76
          ? "energized"
          : "okay",
    happiness:
      stats.happiness >= 92
        ? "glittery"
        : stats.happiness >= 72
          ? "happy"
          : stats.happiness >= 38
            ? "calm"
            : "low",
  };
}

export function deriveMood(stats: PetStats): PetMood {
  const tiers = deriveTiers(stats);

  if (tiers.energy === "tired") {
    return "sleepy";
  }

  if (tiers.hunger === "hungry") {
    return "hungry";
  }

  if (tiers.happiness === "glittery") {
    return "happy";
  }

  return "idle";
}

export function normalizeProgress(progress?: Partial<PetProgress>): PetProgress {
  const startingLevel =
    typeof progress?.level === "number"
      ? Math.min(99, Math.max(1, Math.floor(progress.level)))
      : initialProgress.level;
  const startingXp =
    typeof progress?.xp === "number" ? Math.max(0, Math.floor(progress.xp)) : 0;

  return applyXpToProgress({ level: startingLevel, xp: 0 }, startingXp).progress;
}

export function normalizeActionMemory(value?: PetActionMemory): PetActionMemory {
  const normalized: PetActionMemory = {};

  for (const action of PET_ACTIONS) {
    const entry = value?.[action.name];

    if (
      !entry ||
      typeof entry.lastUsedAt !== "number" ||
      typeof entry.repeatCount !== "number" ||
      typeof entry.cooldownUntil !== "number"
    ) {
      continue;
    }

    normalized[action.name] = {
      lastUsedAt: Math.max(0, entry.lastUsedAt),
      repeatCount: Math.max(0, Math.floor(entry.repeatCount)),
      cooldownUntil: Math.max(0, entry.cooldownUntil),
    };
  }

  return normalized;
}

export function normalizePetState(
  stats: PetStats,
  progress?: Partial<PetProgress>,
  actionMemory?: PetActionMemory,
): PetState {
  const normalizedStats = {
    hunger: clampStat(stats.hunger),
    energy: clampStat(stats.energy),
    happiness: clampStat(stats.happiness),
  };

  return {
    stats: normalizedStats,
    mood: deriveMood(normalizedStats),
    progress: normalizeProgress(progress),
    actionMemory: normalizeActionMemory(actionMemory),
  };
}

export function parsePetState(value: unknown): PetState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    stats?: Partial<Record<keyof PetStats, unknown>>;
    progress?: Partial<PetProgress>;
    actionMemory?: PetActionMemory;
  };

  if (
    typeof candidate.stats?.hunger !== "number" ||
    typeof candidate.stats.energy !== "number" ||
    typeof candidate.stats.happiness !== "number"
  ) {
    return null;
  }

  return normalizePetState(
    {
      hunger: candidate.stats.hunger,
      energy: candidate.stats.energy,
      happiness: candidate.stats.happiness,
    },
    candidate.progress,
    candidate.actionMemory,
  );
}

export function getActionCooldownRemaining(
  pet: PetState,
  actionName: PetActionName,
  now = Date.now(),
) {
  return Math.max(0, (pet.actionMemory[actionName]?.cooldownUntil ?? 0) - now);
}

export function applyPetAction(
  pet: PetState,
  actionName: PetActionName,
  now = Date.now(),
): PetActionResult {
  const action = PET_ACTIONS.find((item) => item.name === actionName);

  if (!action) {
    return createBlockedActionResult(pet, moodMessages[pet.mood]);
  }

  const cooldownRemainingMs = getActionCooldownRemaining(pet, action.name, now);

  if (cooldownRemainingMs > 0) {
    return createBlockedActionResult(
      pet,
      `${action.cooldownMessage} ${formatCooldown(cooldownRemainingMs)} kvar.`,
      cooldownRemainingMs,
    );
  }

  const previousMemory = pet.actionMemory[action.name];
  const repeatCount =
    previousMemory && now - previousMemory.lastUsedAt < ACTION_DIMINISHING_WINDOW_MS
      ? previousMemory.repeatCount + 1
      : 0;
  const multiplier = getDiminishingMultiplier(repeatCount);
  const lowEnergyPlay = action.name === "play" && pet.stats.energy < 24;
  const effectiveMultiplier = lowEnergyPlay
    ? Math.min(multiplier, 0.38)
    : multiplier;
  const statDelta = scaleStats(action.delta, effectiveMultiplier);
  const nextStats = {
    hunger: pet.stats.hunger + statDelta.hunger,
    energy: pet.stats.energy + statDelta.energy,
    happiness: pet.stats.happiness + statDelta.happiness,
  };
  const xpGained = Math.max(
    1,
    Math.round(action.xp * Math.max(0.35, effectiveMultiplier)),
  );
  const xpResult = applyXpToProgress(pet.progress, xpGained);
  const nextActionMemory = {
    ...pet.actionMemory,
    [action.name]: {
      lastUsedAt: now,
      repeatCount,
      cooldownUntil: now + action.cooldownMs,
    },
  };
  const nextPet = normalizePetState(
    nextStats,
    xpResult.progress,
    nextActionMemory,
  );

  return {
    pet: nextPet,
    message: getActionMessage(action, repeatCount, lowEnergyPlay, xpResult.leveledUp),
    animation: action.animation,
    statDelta,
    xpGained,
    leveledUp: xpResult.leveledUp,
    accepted: true,
    cooldownRemainingMs: 0,
  };
}

export function addPetXp(pet: PetState, xp: number) {
  const xpResult = applyXpToProgress(pet.progress, xp);

  return {
    pet: normalizePetState(pet.stats, xpResult.progress, pet.actionMemory),
    xpGained: Math.max(0, Math.floor(xp)),
    leveledUp: xpResult.leveledUp,
  };
}

export function decayPetState(pet: PetState): PetState {
  const hunger = clampStat(pet.stats.hunger + 1);
  const energy = clampStat(pet.stats.energy - 1);
  const happinessLoss = hunger > 78 || energy < 24 ? 2 : 1;

  return normalizePetState(
    {
      hunger,
      energy,
      happiness: pet.stats.happiness - happinessLoss,
    },
    pet.progress,
    pet.actionMemory,
  );
}

export function advancePetState(
  pet: PetState,
  steps: number,
  maxSteps = MAX_OFFLINE_DECAY_STEPS,
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

    const restoredPet = parsePetState(parsed.pet);

    if (!restoredPet) {
      return null;
    }

    const elapsedSteps = Math.floor(
      Math.max(0, now - parsed.savedAt) / PET_DECAY_INTERVAL_MS,
    );

    return advancePetState(restoredPet, elapsedSteps);
  } catch {
    return null;
  }
}

function applyXpToProgress(progress: PetProgress, amount: number) {
  let level = Math.min(99, Math.max(1, Math.floor(progress.level)));
  let xp = Math.max(0, Math.floor(progress.xp + amount));
  let leveledUp = false;

  while (level < 99 && xp >= getXpToNextLevel(level)) {
    xp -= getXpToNextLevel(level);
    level += 1;
    leveledUp = true;
  }

  if (level >= 99) {
    xp = 0;
  }

  return {
    progress: { level, xp },
    leveledUp,
  };
}

function getDiminishingMultiplier(repeatCount: number) {
  if (repeatCount <= 0) {
    return 1;
  }

  if (repeatCount === 1) {
    return 0.58;
  }

  if (repeatCount === 2) {
    return 0.32;
  }

  return 0.2;
}

function scaleStats(stats: PetStats, multiplier: number): PetStats {
  return {
    hunger: Math.round(stats.hunger * multiplier),
    energy: Math.round(stats.energy * multiplier),
    happiness: Math.round(stats.happiness * multiplier),
  };
}

function getActionMessage(
  action: PetActionDefinition,
  repeatCount: number,
  lowEnergyPlay: boolean,
  leveledUp: boolean,
) {
  if (leveledUp) {
    return "Stjärnstoft! Mileahchi gick upp en nivå.";
  }

  if (lowEnergyPlay && action.lowEnergyMessage) {
    return action.lowEnergyMessage;
  }

  return repeatCount > 0 ? action.repeatMessage : action.message;
}

function createBlockedActionResult(
  pet: PetState,
  message: string,
  cooldownRemainingMs = 0,
): PetActionResult {
  return {
    pet,
    message,
    animation: pet.mood === "sleepy" ? "sleepy" : "idle",
    statDelta: { hunger: 0, energy: 0, happiness: 0 },
    xpGained: 0,
    leveledUp: false,
    accepted: false,
    cooldownRemainingMs,
  };
}

function formatCooldown(ms: number) {
  const seconds = Math.ceil(ms / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  return `${Math.ceil(seconds / 60)}m`;
}

function isStoredPetState(value: unknown): value is {
  version: number;
  savedAt: number;
  pet: unknown;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    version?: unknown;
    savedAt?: unknown;
    pet?: unknown;
  };

  return (
    (candidate.version === 1 || candidate.version === PET_STATE_STORAGE_VERSION) &&
    typeof candidate.savedAt === "number" &&
    !!candidate.pet
  );
}
