"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSpriteAnimation } from "@/hooks/use-sprite-animation";
import {
  ALL_SPRITE_FRAMES,
  DEFAULT_ANIMATION_BY_MOOD,
  SPRITE_ANIMATIONS,
  type SpriteAnimationName,
} from "@/lib/tamagotchi/animation-data";
import {
  applyPetAction,
  decayPetState,
  getFullness,
  initialPetState,
  moodMessages,
  PET_ACTIONS,
  type PetActionName,
  type PetState,
} from "@/lib/tamagotchi/pet-state";

type SpeechState = {
  id: number;
  text: string;
  source: "mood" | "action";
};

const actionButtonStyles: Record<PetActionName, string> = {
  feed: "border-rose-100 bg-rose-50 text-rose-700 shadow-rose-200/60 hover:bg-rose-100",
  play: "border-violet-100 bg-violet-50 text-violet-700 shadow-violet-200/60 hover:bg-violet-100",
  sleep:
    "border-indigo-100 bg-indigo-50 text-indigo-700 shadow-indigo-200/60 hover:bg-indigo-100",
  hug: "border-amber-100 bg-amber-50 text-amber-800 shadow-amber-200/60 hover:bg-amber-100",
};

const moodLabels: Record<PetState["mood"], string> = {
  idle: "Mysig",
  happy: "Glittrig",
  hungry: "Sugen",
  sleepy: "Sömnig",
  playful: "Busig",
};

export function Tamagotchi() {
  const [pet, setPet] = useState<PetState>(initialPetState);
  const [speech, setSpeech] = useState<SpeechState>({
    id: 0,
    text: moodMessages[initialPetState.mood],
    source: "mood",
  });
  const [animationRequest, setAnimationRequest] = useState<{
    id: number;
    name: SpriteAnimationName;
    mode: "once";
  } | null>(null);

  const speechIdRef = useRef(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const loadedFrames = ALL_SPRITE_FRAMES.map((src) => {
      const image = new window.Image();
      image.src = src;
      return image;
    });

    return () => {
      loadedFrames.forEach((image) => {
        image.src = "";
      });
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPet((current) => decayPetState(current));
    }, 6200);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (speech.source === "action") {
      return;
    }

    speechIdRef.current += 1;
    setSpeech({
      id: speechIdRef.current,
      text: moodMessages[pet.mood],
      source: "mood",
    });
  }, [pet.mood, speech.source]);

  useEffect(() => {
    if (speech.source !== "action") {
      return;
    }

    const timeout = window.setTimeout(() => {
      speechIdRef.current += 1;
      setSpeech({
        id: speechIdRef.current,
        text: moodMessages[pet.mood],
        source: "mood",
      });
    }, 3600);

    return () => window.clearTimeout(timeout);
  }, [pet.mood, speech]);

  const defaultAnimation = DEFAULT_ANIMATION_BY_MOOD[pet.mood];

  const handleAnimationComplete = useCallback((requestId: number) => {
    setAnimationRequest((current) =>
      current?.id === requestId ? null : current,
    );
  }, []);

  const sprite = useSpriteAnimation({
    animations: SPRITE_ANIMATIONS,
    defaultAnimation,
    request: animationRequest,
    onRequestComplete: handleAnimationComplete,
  });

  const statPills = useMemo(
    () => [
      {
        label: "Glad",
        emoji: "❤️",
        value: pet.stats.happiness,
        barClassName: "bg-gradient-to-r from-rose-300 to-pink-400",
      },
      {
        label: "Energi",
        emoji: "⚡",
        value: pet.stats.energy,
        barClassName: "bg-gradient-to-r from-amber-300 to-orange-400",
      },
      {
        label: "Mätt",
        emoji: "🍎",
        value: getFullness(pet.stats),
        barClassName: "bg-gradient-to-r from-emerald-300 to-teal-400",
      },
    ],
    [pet.stats],
  );

  const handleAction = (actionName: PetActionName) => {
    const result = applyPetAction(pet, actionName);

    setPet(result.pet);

    requestIdRef.current += 1;
    setAnimationRequest({
      id: requestIdRef.current,
      name: result.animation,
      mode: "once",
    });

    speechIdRef.current += 1;
    setSpeech({
      id: speechIdRef.current,
      text: result.message,
      source: "action",
    });
  };

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[radial-gradient(circle_at_50%_0%,#fffaf0_0%,#ffe9ef_42%,#eadfff_100%)] px-4 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-[calc(env(safe-area-inset-top)+0.65rem)] text-[#563744] sm:grid sm:place-items-center">
      <section className="relative mx-auto flex min-h-[calc(100dvh-1.3rem)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/55 p-3.5 shadow-[0_24px_70px_rgba(143,89,122,0.24)] backdrop-blur-xl sm:min-h-[760px] sm:p-5">
        <div
          aria-hidden="true"
          className="companion-glow pointer-events-none absolute inset-x-8 top-24 h-44 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9),rgba(255,214,232,0.45)_46%,rgba(255,255,255,0)_72%)] blur-2xl"
        />

        <header className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-black leading-none text-[#4a2d3b]">
              Mileahchi
            </p>
            <p className="mt-1 text-sm font-medium text-[#8f6575]">
              Din lilla skogsvän
            </p>
          </div>
          <div className="rounded-full border border-white/70 bg-white/65 px-3 py-1.5 text-xs font-bold text-rose-500 shadow-sm">
            {moodLabels[pet.mood]}
          </div>
        </header>

        <div
          aria-label="Mileahchis status"
          className="relative z-10 mt-3 grid grid-cols-3 gap-2"
        >
          {statPills.map((stat) => (
            <div
              key={stat.label}
              className="min-w-0 rounded-2xl border border-white/70 bg-white/65 p-2 shadow-sm"
            >
              <div className="flex items-center justify-between gap-1 text-[10px] font-black text-[#6b4957]">
                <span className="min-w-0 truncate">
                  <span aria-hidden="true">{stat.emoji}</span> {stat.label}
                </span>
                <span>{stat.value}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f5e7e4]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${stat.barClassName}`}
                  style={{ width: `${stat.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <section className="relative z-10 flex flex-1 flex-col items-center justify-center py-2">
          <div
            key={speech.id}
            aria-live="polite"
            className="companion-bubble-pop relative min-h-[56px] w-full max-w-[17.5rem] rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-center text-sm font-bold leading-snug text-[#624454] shadow-[0_12px_28px_rgba(130,83,109,0.14)]"
          >
            {speech.text}
            <span
              aria-hidden="true"
              className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-white/80 bg-white/80"
            />
          </div>

          <div className="relative mt-2 flex w-full flex-1 items-center justify-center overflow-visible">
            <div
              aria-hidden="true"
              className="companion-glow absolute h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.96)_0%,rgba(255,198,221,0.62)_42%,rgba(196,171,255,0.22)_68%,rgba(255,255,255,0)_76%)] blur-xl"
            />
            <div className="relative z-10 h-[clamp(390px,112vw,452px)] w-[clamp(270px,82vw,320px)]">
              <Image
                priority
                unoptimized
                src={sprite.frame}
                alt={sprite.alt}
                fill
                sizes="(max-width: 640px) 82vw, 320px"
                className="select-none object-contain drop-shadow-[0_24px_24px_rgba(118,70,101,0.22)]"
                draggable={false}
              />
            </div>
          </div>
        </section>

        <div className="relative z-10 mt-auto grid grid-cols-2 gap-2">
          {PET_ACTIONS.map((action) => (
            <button
              key={action.name}
              type="button"
              onClick={() => handleAction(action.name)}
              className={`flex min-h-[60px] items-center justify-center gap-2 rounded-2xl border px-4 text-base font-black shadow-lg transition duration-150 ease-out active:scale-95 ${actionButtonStyles[action.name]}`}
            >
              <span className="text-xl" aria-hidden="true">
                {action.emoji}
              </span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
