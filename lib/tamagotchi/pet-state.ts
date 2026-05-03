import {
  isPetOutfit,
  isPetScene,
  type PetOutfit,
  type PetScene,
} from "@/lib/pet/pet-scenes";

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

export type PetActionName = "feed" | "sleep" | "school" | "wardrobe";

export type PetActivityName = "eating" | "sleeping" | "school" | "changing";

export type PetActivity = {
  name: PetActivityName;
  scene: PetScene;
  startedAt: number;
  endsAt: number;
  startStats: PetStats;
  targetStats: PetStats;
  message: string;
  pendingOutfit?: PetOutfit;
};

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
  scene: PetScene;
  outfit: PetOutfit;
  activity: PetActivity | null;
  lastDecayAt: number;
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
  scene: PetScene;
  activityName?: PetActivityName;
  durationMs?: number;
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

export type PetActionOptions = {
  outfit?: PetOutfit;
};

export type PetTiers = {
  hunger: "hungry" | "okay" | "full";
  energy: "tired" | "okay" | "energized";
  happiness: "low" | "calm" | "happy" | "glittery";
};

export const PET_DECAY_INTERVAL_MS = 5 * 60_000;
export const PET_STATE_STORAGE_KEY = "mileahchi.pet-state.v2";
export const ACTION_DIMINISHING_WINDOW_MS = 4 * 60_000;

const PET_STATE_STORAGE_VERSION = 4;
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
  scene: "home",
  outfit: "pajamas",
  activity: null,
  lastDecayAt: Date.now(),
};

export const PET_ACTIONS: PetActionDefinition[] = [
  {
    name: "feed",
    label: "Ät",
    emoji: "🍎",
    message: "Jag sitter vid bordet och mumsar långsamt.",
    repeatMessage: "Jag är nästan mätt, men tack för den lilla biten.",
    cooldownMessage: "Magen vill smälta lite först.",
    animation: "happy",
    delta: { hunger: -22, energy: 2, happiness: 4 },
    cooldownMs: 95_000,
    xp: 8,
    scene: "dining",
    activityName: "eating",
    durationMs: 90_000,
  },
  {
    name: "sleep",
    label: "Sov",
    emoji: "🌙",
    message: "Lampan blir mjuk. Jag kryper ner i sängen.",
    repeatMessage: "En liten extra vila räcker fint.",
    cooldownMessage: "Jag vaknar snart, mjukt och försiktigt.",
    animation: "sleepy",
    delta: { hunger: 4, energy: 28, happiness: 5 },
    cooldownMs: 15 * 60_000,
    xp: 10,
    scene: "bedroom",
    activityName: "sleeping",
    durationMs: 10 * 60_000,
  },
  {
    name: "school",
    label: "Skola",
    emoji: "🎒",
    message: "Jag vinkar hej då och lär mig något mjukt.",
    repeatMessage: "Jag gick redan på en liten skoldag.",
    cooldownMessage: "Skolväskan behöver vila.",
    lowEnergyMessage: "Jag behöver vila lite innan skolan.",
    animation: "playful",
    delta: { hunger: 6, energy: -10, happiness: 5 },
    cooldownMs: 8 * 60 * 60_000,
    xp: 26,
    scene: "school",
    activityName: "school",
    durationMs: 7 * 60_000,
  },
  {
    name: "wardrobe",
    label: "Kläder",
    emoji: "👗",
    message: "Jag provar kläder framför spegeln.",
    repeatMessage: "Vi byter bara en liten detalj nu.",
    cooldownMessage: "Garderoben snurrar klart först.",
    animation: "happy",
    delta: { hunger: 0, energy: 0, happiness: 2 },
    cooldownMs: 45_000,
    xp: 5,
    scene: "wardrobe",
    activityName: "changing",
    durationMs: 7_000,
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

export function getActivePetScene(pet: PetState): PetScene {
  return pet.activity?.scene ?? pet.scene;
}

export function getPetDefaultMessage(pet: PetState) {
  if (!pet.activity) {
    return moodMessages[pet.mood];
  }

  if (pet.activity.name === "sleeping") {
    return "Jag sover nu, vi kan leka senare.";
  }

  if (pet.activity.name === "eating") {
    return "Jag äter lite i taget. Magen blir glad.";
  }

  if (pet.activity.name === "school") {
    return "Jag är i skolan och lär mig små saker.";
  }

  return "Jag byter om. Snart är jag klar.";
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
  meta?: Partial<Pick<PetState, "scene" | "outfit" | "activity" | "lastDecayAt">>,
): PetState {
  const normalizedStats = {
    hunger: clampStat(stats.hunger),
    energy: clampStat(stats.energy),
    happiness: clampStat(stats.happiness),
  };
  const activity = normalizeActivity(meta?.activity);

  return {
    stats: normalizedStats,
    mood: deriveMoodForState(normalizedStats, activity),
    progress: normalizeProgress(progress),
    actionMemory: normalizeActionMemory(actionMemory),
    scene: isPetScene(meta?.scene) ? meta.scene : "home",
    outfit: isPetOutfit(meta?.outfit) ? meta.outfit : "pajamas",
    activity,
    lastDecayAt:
      typeof meta?.lastDecayAt === "number" && Number.isFinite(meta.lastDecayAt)
        ? meta.lastDecayAt
        : Date.now(),
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
    scene?: unknown;
    outfit?: unknown;
    activity?: unknown;
    lastDecayAt?: unknown;
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
    {
      scene: isPetScene(candidate.scene) ? candidate.scene : "home",
      outfit: isPetOutfit(candidate.outfit) ? candidate.outfit : "pajamas",
      activity: parseActivity(candidate.activity),
      lastDecayAt:
        typeof candidate.lastDecayAt === "number"
          ? candidate.lastDecayAt
          : Date.now(),
    },
  );
}

export function getActionCooldownRemaining(
  pet: PetState,
  actionName: PetActionName,
  now = Date.now(),
) {
  return Math.max(0, (pet.actionMemory[actionName]?.cooldownUntil ?? 0) - now);
}

export function setPetScene(pet: PetState, scene: PetScene): PetState {
  return normalizePetState(pet.stats, pet.progress, pet.actionMemory, {
    ...getPetMeta(pet),
    scene,
    activity: null,
  });
}

export function advancePetActivity(pet: PetState, now = Date.now()): PetState {
  if (!pet.activity) {
    return pet;
  }

  const duration = Math.max(1, pet.activity.endsAt - pet.activity.startedAt);
  const elapsed = Math.max(0, now - pet.activity.startedAt);
  const progress = Math.min(1, elapsed / duration);
  const stats = interpolateStats(
    pet.activity.startStats,
    pet.activity.targetStats,
    progress,
  );

  if (now < pet.activity.endsAt) {
    return normalizePetState(stats, pet.progress, pet.actionMemory, {
      ...getPetMeta(pet),
      scene: pet.activity.scene,
      activity: pet.activity,
    });
  }

  return normalizePetState(stats, pet.progress, pet.actionMemory, {
    ...getPetMeta(pet),
    scene: "home",
    outfit: pet.activity.pendingOutfit ?? pet.outfit,
    activity: null,
    lastDecayAt: now,
  });
}

export function applyPetAction(
  pet: PetState,
  actionName: PetActionName,
  now = Date.now(),
  options: PetActionOptions = {},
): PetActionResult {
  const readyPet = advancePetActivity(pet, now);

  if (readyPet.activity) {
    return createBlockedActionResult(
      readyPet,
      getActivityBlockedMessage(readyPet.activity.name),
    );
  }

  const action = PET_ACTIONS.find((item) => item.name === actionName);

  if (!action) {
    return createBlockedActionResult(readyPet, getPetDefaultMessage(readyPet));
  }

  if (action.name === "wardrobe" && !options.outfit) {
    return {
      pet: setPetScene(readyPet, "wardrobe"),
      message: "Välj en outfit i garderoben.",
      animation: "happy",
      statDelta: { hunger: 0, energy: 0, happiness: 0 },
      xpGained: 0,
      leveledUp: false,
      accepted: true,
      cooldownRemainingMs: 0,
    };
  }

  const cooldownRemainingMs = getActionCooldownRemaining(
    readyPet,
    action.name,
    now,
  );

  if (cooldownRemainingMs > 0) {
    return createBlockedActionResult(
      readyPet,
      `${action.cooldownMessage} ${formatCooldown(cooldownRemainingMs)} kvar.`,
      cooldownRemainingMs,
    );
  }

  const previousMemory = readyPet.actionMemory[action.name];
  const repeatCount =
    previousMemory && now - previousMemory.lastUsedAt < ACTION_DIMINISHING_WINDOW_MS
      ? previousMemory.repeatCount + 1
      : 0;
  const multiplier = getDiminishingMultiplier(repeatCount);
  const lowEnergySchool = action.name === "school" && readyPet.stats.energy < 24;
  const effectiveMultiplier = lowEnergySchool
    ? Math.min(multiplier, 0.38)
    : multiplier;
  const statDelta = scaleStats(action.delta, effectiveMultiplier);
  const nextStats = {
    hunger: readyPet.stats.hunger + statDelta.hunger,
    energy: readyPet.stats.energy + statDelta.energy,
    happiness: readyPet.stats.happiness + statDelta.happiness,
  };
  const xpGained = Math.max(
    1,
    Math.round(action.xp * Math.max(0.35, effectiveMultiplier)),
  );
  const xpResult = applyXpToProgress(readyPet.progress, xpGained);
  const nextActionMemory = {
    ...readyPet.actionMemory,
    [action.name]: {
      lastUsedAt: now,
      repeatCount,
      cooldownUntil: now + action.cooldownMs,
    },
  };
  const clampedTargetStats = clampStats(nextStats);
  const nextPet =
    action.activityName && action.durationMs
      ? normalizePetState(readyPet.stats, xpResult.progress, nextActionMemory, {
          ...getPetMeta(readyPet),
          scene: action.scene,
          activity: {
            name: action.activityName,
            scene: action.scene,
            startedAt: now,
            endsAt: now + action.durationMs,
            startStats: readyPet.stats,
            targetStats: clampedTargetStats,
            message: action.message,
            pendingOutfit:
              action.name === "wardrobe" ? options.outfit : undefined,
          },
          lastDecayAt: now,
        })
      : normalizePetState(clampedTargetStats, xpResult.progress, nextActionMemory, {
          ...getPetMeta(readyPet),
          scene: action.scene,
          lastDecayAt: now,
        });

  return {
    pet: nextPet,
    message: getActionMessage(
      action,
      repeatCount,
      lowEnergySchool,
      xpResult.leveledUp,
    ),
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
    pet: normalizePetState(pet.stats, xpResult.progress, pet.actionMemory, pet),
    xpGained: Math.max(0, Math.floor(xp)),
    leveledUp: xpResult.leveledUp,
  };
}

export function decayPetState(pet: PetState): PetState {
  const readyPet = advancePetActivity(pet);

  if (readyPet.activity) {
    return readyPet;
  }

  const hunger = clampStat(readyPet.stats.hunger + 1);
  const energy = clampStat(readyPet.stats.energy - 1);
  const happinessLoss = hunger > 78 || energy < 24 ? 2 : 1;

  return normalizePetState(
    {
      hunger,
      energy,
      happiness: readyPet.stats.happiness - happinessLoss,
    },
    readyPet.progress,
    readyPet.actionMemory,
    {
      ...getPetMeta(readyPet),
      lastDecayAt: Date.now(),
    },
  );
}

export function advancePetState(
  pet: PetState,
  steps: number,
  maxSteps = MAX_OFFLINE_DECAY_STEPS,
): PetState {
  const safeSteps = Math.min(Math.max(0, Math.floor(steps)), maxSteps);
  let nextPet = advancePetActivity(pet);

  if (nextPet.activity) {
    return nextPet;
  }

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

function deriveMoodForState(
  stats: PetStats,
  activity: PetActivity | null,
): PetMood {
  if (activity?.name === "sleeping") {
    return "sleepy";
  }

  if (activity?.name === "eating") {
    return stats.hunger > 54 ? "hungry" : "happy";
  }

  if (activity?.name === "school") {
    return "playful";
  }

  if (activity?.name === "changing") {
    return "happy";
  }

  return deriveMood(stats);
}

function getPetMeta(
  pet: PetState,
): Pick<PetState, "scene" | "outfit" | "activity" | "lastDecayAt"> {
  return {
    scene: pet.scene,
    outfit: pet.outfit,
    activity: pet.activity,
    lastDecayAt: pet.lastDecayAt,
  };
}

function normalizeActivity(value: unknown): PetActivity | null {
  const activity = parseActivity(value);

  if (!activity) {
    return null;
  }

  return activity;
}

function parseActivity(value: unknown): PetActivity | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<PetActivity>;

  if (
    !isActivityName(candidate.name) ||
    !isPetScene(candidate.scene) ||
    typeof candidate.startedAt !== "number" ||
    typeof candidate.endsAt !== "number" ||
    candidate.endsAt <= candidate.startedAt ||
    !isStats(candidate.startStats) ||
    !isStats(candidate.targetStats)
  ) {
    return null;
  }

  return {
    name: candidate.name,
    scene: candidate.scene,
    startedAt: Math.max(0, candidate.startedAt),
    endsAt: Math.max(0, candidate.endsAt),
    startStats: clampStats(candidate.startStats),
    targetStats: clampStats(candidate.targetStats),
    message:
      typeof candidate.message === "string"
        ? candidate.message.slice(0, 140)
        : "",
    pendingOutfit: isPetOutfit(candidate.pendingOutfit)
      ? candidate.pendingOutfit
      : undefined,
  };
}

function isActivityName(value: unknown): value is PetActivityName {
  return (
    value === "eating" ||
    value === "sleeping" ||
    value === "school" ||
    value === "changing"
  );
}

function isStats(value: unknown): value is PetStats {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Record<keyof PetStats, unknown>>;

  return (
    typeof candidate.hunger === "number" &&
    typeof candidate.energy === "number" &&
    typeof candidate.happiness === "number"
  );
}

function clampStats(stats: PetStats): PetStats {
  return {
    hunger: clampStat(stats.hunger),
    energy: clampStat(stats.energy),
    happiness: clampStat(stats.happiness),
  };
}

function interpolateStats(
  startStats: PetStats,
  targetStats: PetStats,
  progress: number,
): PetStats {
  return {
    hunger: Math.round(startStats.hunger + (targetStats.hunger - startStats.hunger) * progress),
    energy: Math.round(startStats.energy + (targetStats.energy - startStats.energy) * progress),
    happiness: Math.round(
      startStats.happiness + (targetStats.happiness - startStats.happiness) * progress,
    ),
  };
}

function getActivityBlockedMessage(activityName: PetActivityName) {
  if (activityName === "sleeping") {
    return "Jag sover nu, vi kan leka senare.";
  }

  if (activityName === "eating") {
    return "Jag äter klart först.";
  }

  if (activityName === "school") {
    return "Jag är i skolan och kommer snart tillbaka.";
  }

  return "Jag byter om, vänta lite.";
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

  const minutes = Math.ceil(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  return `${Math.ceil(minutes / 60)}h`;
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
    (candidate.version === 1 ||
      candidate.version === 2 ||
      candidate.version === 3 ||
      candidate.version === PET_STATE_STORAGE_VERSION) &&
    typeof candidate.savedAt === "number" &&
    !!candidate.pet
  );
}
