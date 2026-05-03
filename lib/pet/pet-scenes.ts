export type PetScene = "home" | "bedroom" | "dining" | "wardrobe" | "school";

export type PetOutfit = "pajamas" | "day" | "school";

export type PetSceneDefinition = {
  name: PetScene;
  label: string;
  background: string | null;
};

export type PetScenePresentation = {
  background: string;
  position: string;
  characterClassName: string;
  isComposite: boolean;
};

export type PetOutfitDefinition = {
  name: PetOutfit;
  label: string;
  emoji: string;
  sprite: string;
  unlockLevel: number;
};

export const PET_SCENES: Record<PetScene, PetSceneDefinition> = {
  home: {
    name: "home",
    label: "Glänta",
    background: "/character/scene/dining.png",
  },
  bedroom: {
    name: "bedroom",
    label: "Sovrum",
    background: "/character/scene/bedroom.png",
  },
  dining: {
    name: "dining",
    label: "Matplats",
    background: "/character/scene/dining.png",
  },
  wardrobe: {
    name: "wardrobe",
    label: "Garderob",
    background: "/character/scene/wardrobe.png",
  },
  school: {
    name: "school",
    label: "Skola",
    background: "/character/scene/school.png",
  },
};

const defaultCharacterClassName = "translate-y-2 scale-100 opacity-100";

export function getPetScenePresentation(
  scene: PetScene,
  activityName?: "eating" | "sleeping" | "school" | "changing",
): PetScenePresentation {
  if (activityName === "sleeping") {
    return {
      background: "/character/scene/sleeping.png",
      position: "center center",
      characterClassName: "translate-y-3 scale-90 opacity-0",
      isComposite: true,
    };
  }

  if (activityName === "eating") {
    return {
      background: "/character/scene/eating.png",
      position: "center center",
      characterClassName: "translate-y-3 scale-90 opacity-0",
      isComposite: true,
    };
  }

  if (activityName === "school") {
    return {
      background: "/character/scene/school.png",
      position: "center center",
      characterClassName: "translate-y-2 scale-95 opacity-100",
      isComposite: false,
    };
  }

  if (activityName === "changing") {
    return {
      background: "/character/scene/wardrobe.png",
      position: "center center",
      characterClassName: "translate-y-2 scale-100 opacity-100",
      isComposite: false,
    };
  }

  const background = PET_SCENES[scene].background ?? PET_SCENES.home.background;

  return {
    background: background ?? "/character/scene/dining.png",
    position: "center center",
    characterClassName: defaultCharacterClassName,
    isComposite: false,
  };
}

export const PET_OUTFITS: Record<PetOutfit, PetOutfitDefinition> = {
  pajamas: {
    name: "pajamas",
    label: "Pyjamas",
    emoji: "🌙",
    sprite: "/character/outfits/pajamas.png",
    unlockLevel: 1,
  },
  day: {
    name: "day",
    label: "Dagskläder",
    emoji: "🌼",
    sprite: "/character/outfits/day.png",
    unlockLevel: 1,
  },
  school: {
    name: "school",
    label: "Skolkläder",
    emoji: "🎒",
    sprite: "/character/outfits/school.png",
    unlockLevel: 2,
  },
};

export function isPetScene(value: unknown): value is PetScene {
  return typeof value === "string" && value in PET_SCENES;
}

export function isPetOutfit(value: unknown): value is PetOutfit {
  return typeof value === "string" && value in PET_OUTFITS;
}
