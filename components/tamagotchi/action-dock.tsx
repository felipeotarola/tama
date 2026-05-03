import {
  getActionCooldownRemaining,
  PET_ACTIONS,
  type PetActionName,
  type PetState,
} from "@/lib/tamagotchi/pet-state";

type ActionDockProps = {
  pet: PetState;
  now: number;
  onAction: (action: PetActionName) => void;
};

const actionStyles: Record<PetActionName, string> = {
  feed: "from-rose-50 to-red-100 text-rose-700 shadow-rose-200/60",
  play: "from-violet-50 to-purple-100 text-violet-700 shadow-violet-200/60",
  sleep: "from-blue-50 to-indigo-100 text-blue-700 shadow-blue-200/60",
  hug: "from-amber-50 to-orange-100 text-amber-800 shadow-amber-200/60",
};

export function ActionDock({ pet, now, onAction }: ActionDockProps) {
  return (
    <div className="relative z-10 grid grid-cols-4 gap-2.5">
      {PET_ACTIONS.map((action) => {
        const cooldownRemainingMs = getActionCooldownRemaining(
          pet,
          action.name,
          now,
        );
        const isCoolingDown = cooldownRemainingMs > 0;

        return (
          <button
            key={action.name}
            type="button"
            onClick={() => onAction(action.name)}
            disabled={isCoolingDown}
            className={`relative flex aspect-square min-h-[72px] flex-col items-center justify-center rounded-full border border-white/80 bg-gradient-to-br p-1.5 text-center font-black shadow-lg transition duration-150 ease-out active:scale-95 disabled:scale-100 disabled:opacity-60 ${actionStyles[action.name]}`}
          >
            <span className="text-[2rem] leading-none" aria-hidden="true">
              {action.emoji}
            </span>
            <span className="mt-1 text-[13px] leading-none">{action.label}</span>
            {isCoolingDown ? (
              <span className="absolute inset-x-2 bottom-1 rounded-full bg-white/75 px-1 py-0.5 text-[10px] text-[#7a5a70]">
                {formatCooldown(cooldownRemainingMs)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function formatCooldown(ms: number) {
  const seconds = Math.ceil(ms / 1000);
  return seconds < 60 ? `${seconds}s` : `${Math.ceil(seconds / 60)}m`;
}
