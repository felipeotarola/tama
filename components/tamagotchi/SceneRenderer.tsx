import Image from "next/image";

import { getPetActivityProgress } from "@/lib/pet/pet-actions";
import {
  getPetScenePresentation,
  PET_OUTFITS,
} from "@/lib/pet/pet-scenes";
import {
  getActivePetScene,
  type PetState,
} from "@/lib/tamagotchi/pet-state";

type SceneRendererProps = {
  pet: PetState;
  now: number;
  spriteFrame: string;
  spriteAlt: string;
};

export function SceneRenderer({
  pet,
  now,
  spriteFrame,
  spriteAlt,
}: SceneRendererProps) {
  const outfit = PET_OUTFITS[pet.outfit];
  const activityProgress = getPetActivityProgress(pet, now);
  const presentation = getPetScenePresentation(
    getActivePetScene(pet),
    pet.activity?.name,
  );
  const isAtSchool =
    pet.activity?.name === "school" &&
    activityProgress &&
    activityProgress.fraction > 0.14 &&
    activityProgress.fraction < 0.9;
  const characterSrc = pet.outfit === "pajamas" ? spriteFrame : outfit.sprite;

  return (
    <div className="relative mt-1 flex min-h-[250px] w-full flex-1 items-end justify-center overflow-visible pb-[clamp(0.1rem,1dvh,0.6rem)]">
      {!presentation.isComposite ? (
        <div
          aria-hidden="true"
          className="companion-glow absolute bottom-1 h-[min(72vw,19rem)] w-[min(72vw,19rem)] rounded-full bg-[radial-gradient(circle,rgba(255,250,180,0.54)_0%,rgba(255,201,225,0.28)_44%,rgba(196,171,255,0.12)_70%,rgba(255,255,255,0)_76%)] blur-xl"
        />
      ) : null}

      <div
        className={`companion-float relative z-10 h-full max-h-[390px] min-h-[245px] w-[min(82vw,330px)] transition duration-700 ease-out ${
          presentation.isComposite || isAtSchool
            ? "translate-y-3 scale-90 opacity-0"
            : presentation.characterClassName
        }`}
      >
        <Image
          priority
          unoptimized
          src={characterSrc}
          alt={pet.outfit === "pajamas" ? spriteAlt : `Mileahchi i ${outfit.label}`}
          fill
          sizes="(max-width: 640px) 78vw, 320px"
          className="select-none object-contain drop-shadow-[0_24px_24px_rgba(118,70,101,0.22)]"
          draggable={false}
        />
      </div>

      {isAtSchool ? (
        <div className="relative z-10 rounded-full border border-white/70 bg-white/74 px-4 py-2 text-center text-sm font-black text-[#6a4961] shadow-lg backdrop-blur">
          I skolan
        </div>
      ) : null}
    </div>
  );
}
