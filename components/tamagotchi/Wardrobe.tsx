import { PET_OUTFITS, type PetOutfit } from "@/lib/pet/pet-scenes";
import type { PetState } from "@/lib/tamagotchi/pet-state";

type WardrobeProps = {
  pet: PetState;
  disabled: boolean;
  onSelect: (outfit: PetOutfit) => void;
};

export function Wardrobe({ pet, disabled, onSelect }: WardrobeProps) {
  return (
    <div className="relative z-20 mt-2 grid w-full grid-cols-3 gap-2 rounded-[1.35rem] border border-white/70 bg-white/68 p-2 shadow-[0_12px_24px_rgba(111,74,105,0.13)] backdrop-blur">
      {Object.values(PET_OUTFITS).map((outfit) => {
        const isLocked = pet.progress.level < outfit.unlockLevel;
        const isActive = pet.outfit === outfit.name && !pet.activity;

        return (
          <button
            key={outfit.name}
            type="button"
            disabled={disabled || isLocked || isActive}
            onClick={() => onSelect(outfit.name)}
            className={`min-h-12 rounded-2xl border px-2 py-2 text-center text-[11px] font-black shadow-sm transition active:scale-95 disabled:scale-100 ${
              isActive
                ? "border-pink-200 bg-pink-100 text-rose-600"
                : "border-white/75 bg-white/72 text-[#6a4961]"
            } disabled:opacity-55`}
          >
            <span className="block text-lg leading-none" aria-hidden="true">
              {isLocked ? "🔒" : outfit.emoji}
            </span>
            <span className="mt-1 block truncate">{outfit.label}</span>
          </button>
        );
      })}
    </div>
  );
}
