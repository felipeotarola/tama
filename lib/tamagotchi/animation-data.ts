import type { PetMood } from "./pet-state";

export type SpriteAnimationName = "idle" | "happy" | "playful" | "sleepy";

export type SpriteAnimationDefinition = {
  name: SpriteAnimationName;
  alt: string;
  frameMs: number;
  frames: string[];
};

const frames = (name: SpriteAnimationName, count: number) =>
  Array.from(
    { length: count },
    (_, index) => `/character/animations/${name}/frame-${index + 1}.png`,
  );

export const SPRITE_ANIMATIONS: Record<
  SpriteAnimationName,
  SpriteAnimationDefinition
> = {
  idle: {
    name: "idle",
    alt: "Mileahchi andas lugnt",
    frameMs: 320,
    frames: frames("idle", 6),
  },
  happy: {
    name: "happy",
    alt: "Mileahchi firar glatt",
    frameMs: 210,
    frames: frames("happy", 4),
  },
  playful: {
    name: "playful",
    alt: "Mileahchi leker med en liten boll",
    frameMs: 210,
    frames: frames("playful", 4),
  },
  sleepy: {
    name: "sleepy",
    alt: "Mileahchi blir sömnig",
    frameMs: 340,
    frames: frames("sleepy", 4),
  },
};

export const ALL_SPRITE_FRAMES = Object.values(SPRITE_ANIMATIONS).flatMap(
  (animation) => animation.frames,
);

export const DEFAULT_ANIMATION_BY_MOOD: Record<PetMood, SpriteAnimationName> = {
  idle: "idle",
  happy: "idle",
  hungry: "idle",
  sleepy: "sleepy",
  playful: "idle",
};
