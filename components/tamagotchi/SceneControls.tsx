import {
  formatActivityRemaining,
  getPetActivityProgress,
} from "@/lib/pet/pet-actions";
import type { PetState } from "@/lib/tamagotchi/pet-state";

type SceneControlsProps = {
  pet: PetState;
  now: number;
};

export function SceneControls({ pet, now }: SceneControlsProps) {
  const progress = getPetActivityProgress(pet, now);

  if (!progress) {
    return null;
  }

  return (
    <div className="relative z-20 mt-2 w-full rounded-full border border-white/75 bg-white/72 px-3 py-2 shadow-[0_12px_24px_rgba(111,74,105,0.13)] backdrop-blur">
      <div className="flex items-center justify-between gap-3 text-[12px] font-black text-[#6b4a61]">
        <span className="truncate">{progress.label}</span>
        <span className="shrink-0 text-[#9a728b]">
          {formatActivityRemaining(progress.remainingMs)}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#ead6e4]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pink-400 via-violet-400 to-amber-300 transition-[width] duration-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}
