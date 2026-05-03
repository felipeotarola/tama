import type { SpriteAnimationName } from "@/lib/tamagotchi/animation-data";
import {
  addPetXp,
  normalizePetState,
  type PetState,
} from "@/lib/tamagotchi/pet-state";

type ChatEffect = {
  pet: PetState;
  animation: SpriteAnimationName;
};

const KIND_WORDS = [
  "älskar",
  "tycker om",
  "fin",
  "snäll",
  "kram",
  "love",
  "cute",
  "kind",
  "hug",
];

const PLAY_WORDS = ["leka", "lek", "spela", "bus", "play", "game"];
const SLEEP_WORDS = ["god natt", "sova", "natti", "trött", "sleep", "bed"];
const HUNGRY_WORDS = ["hungrig", "mat", "mellis", "äta", "hungry", "food"];

export function applyChatEffect(pet: PetState, userMessage: string): ChatEffect {
  const message = userMessage.toLowerCase();

  if (containsAny(message, SLEEP_WORDS)) {
    return {
      pet: withChatXp(
        normalizePetState(
          {
            hunger: pet.stats.hunger,
            energy: pet.stats.energy - 2,
            happiness: pet.stats.happiness + 1,
          },
          pet.progress,
          pet.actionMemory,
        ),
      ),
      animation: "sleepy",
    };
  }

  if (containsAny(message, PLAY_WORDS)) {
    return {
      pet: withChatXp(
        normalizePetState(
          {
            hunger: pet.stats.hunger + 1,
            energy: pet.stats.energy - 3,
            happiness: pet.stats.happiness + 3,
          },
          pet.progress,
          pet.actionMemory,
        ),
      ),
      animation: "playful",
    };
  }

  if (containsAny(message, HUNGRY_WORDS) && pet.stats.hunger >= 68) {
    return {
      pet: withChatXp(pet),
      animation: "hungry",
    };
  }

  if (containsAny(message, KIND_WORDS)) {
    return {
      pet: withChatXp(
        normalizePetState(
          {
            hunger: pet.stats.hunger,
            energy: pet.stats.energy,
            happiness: pet.stats.happiness + 3,
          },
          pet.progress,
          pet.actionMemory,
        ),
      ),
      animation: "happy",
    };
  }

  return {
    pet: withChatXp(
      normalizePetState(
        {
          hunger: pet.stats.hunger,
          energy: pet.stats.energy,
          happiness: pet.stats.happiness + 1,
        },
        pet.progress,
        pet.actionMemory,
      ),
    ),
    animation: "happy",
  };
}

function withChatXp(pet: PetState) {
  return addPetXp(pet, 3).pet;
}

function containsAny(message: string, words: string[]) {
  return words.some((word) => message.includes(word));
}
