import type { PetActivity, PetActivityName, PetState } from "@/lib/tamagotchi/pet-state";

export type PetActivityProgress = {
  activity: PetActivity;
  fraction: number;
  percent: number;
  remainingMs: number;
  label: string;
};

const activityLabels: Record<PetActivityName, string> = {
  eating: "Äter klart",
  sleeping: "Sover mjukt",
  school: "Är i skolan",
  changing: "Byter kläder",
};

export function getPetActivityProgress(
  pet: PetState,
  now = Date.now(),
): PetActivityProgress | null {
  if (!pet.activity) {
    return null;
  }

  const duration = Math.max(1, pet.activity.endsAt - pet.activity.startedAt);
  const elapsed = Math.max(0, now - pet.activity.startedAt);
  const fraction = Math.min(1, elapsed / duration);

  return {
    activity: pet.activity,
    fraction,
    percent: Math.round(fraction * 100),
    remainingMs: Math.max(0, pet.activity.endsAt - now),
    label: activityLabels[pet.activity.name],
  };
}

export function formatActivityRemaining(ms: number) {
  const seconds = Math.ceil(ms / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  return `${Math.ceil(seconds / 60)}m`;
}
