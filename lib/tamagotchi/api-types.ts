import type { SpriteAnimationName } from "./animation-data";
import type { PetActionName, PetState } from "./pet-state";

export type StorageMode = "supabase" | "local";

export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMessageDTO = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};

export type PetLoadRequest = {
  guestId: string;
  clientPet: PetState;
};

export type PetLoadResponse = {
  pet: PetState;
  messages: ChatMessageDTO[];
  storage: StorageMode;
  notice?: string;
};

export type PetActionRequest = {
  guestId: string;
  action: PetActionName;
  clientPet: PetState;
};

export type PetActionResponse = {
  pet: PetState;
  message: string;
  animation: SpriteAnimationName;
  xpGained: number;
  leveledUp: boolean;
  accepted: boolean;
  cooldownRemainingMs: number;
  storage: StorageMode;
  notice?: string;
};

export type ChatRequest = {
  guestId: string;
  message: string;
  clientPet: PetState;
  clientMessages?: ChatMessageDTO[];
};

export type ChatResponse = {
  pet: PetState;
  message: string;
  animation: SpriteAnimationName;
  messages: ChatMessageDTO[];
  storage: StorageMode;
  notice?: string;
};
