import { getLevelProgress, type PetState } from "@/lib/tamagotchi/pet-state";

type LevelBarProps = {
  pet: PetState;
};

export function LevelBar({ pet }: LevelBarProps) {
  const progress = getLevelProgress(pet.progress);

  return (
    <div className="relative z-10 flex min-h-[48px] items-center gap-3 rounded-[1.35rem] border border-white/75 bg-white/72 px-3 shadow-[0_12px_30px_rgba(122,80,112,0.14)] backdrop-blur">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-yellow-200 to-amber-400 text-base font-black text-white shadow-[0_8px_18px_rgba(244,181,64,0.35)]">
        {progress.level}
      </div>
      <div className="min-w-0 flex-1">
        <div className="h-3 overflow-hidden rounded-full bg-[#ead9e7]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-rose-300 transition-all duration-700 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>
      <p className="shrink-0 text-xs font-black text-[#8d6980]">
        {progress.xp}/{progress.xpToNextLevel} xp
      </p>
    </div>
  );
}
