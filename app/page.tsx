"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Mood = "idle" | "happy" | "hungry" | "sleepy" | "playful";

type PetStats = {
  fullness: number;
  energy: number;
  happiness: number;
};

type PetAction = {
  key: string;
  label: string;
  emoji: string;
  mood: Mood;
  message: string;
  delta: PetStats;
  className: string;
};

type Reaction = {
  id: number;
  mood: Mood;
  message: string;
};

const clampStat = (value: number) => Math.min(100, Math.max(0, value));

const initialStats: PetStats = {
  fullness: 74,
  energy: 68,
  happiness: 82,
};

const sprites: Record<Mood, { src: string; alt: string }> = {
  idle: {
    src: "/character/idle-transparent.png",
    alt: "Mileahchi smiling softly",
  },
  happy: {
    src: "/character/happy.png",
    alt: "Mileahchi feeling happy",
  },
  hungry: {
    src: "/character/hungry-transparent.png",
    alt: "Mileahchi feeling hungry",
  },
  sleepy: {
    src: "/character/sleepy-transparent.png",
    alt: "Mileahchi feeling sleepy",
  },
  playful: {
    src: "/character/playful.png",
    alt: "Mileahchi ready to play",
  },
};

const moodMessages: Record<Mood, string> = {
  idle: "I saved a soft little leaf for you.",
  happy: "My heart feels all sparkly now.",
  hungry: "My tummy is doing tiny rumbles.",
  sleepy: "A cozy nap would feel dreamy.",
  playful: "Let's play until the forest giggles.",
};

const actions: PetAction[] = [
  {
    key: "feed",
    label: "Feed",
    emoji: "🍎",
    mood: "happy",
    message: "Yum. That apple tasted like sunshine.",
    delta: { fullness: 24, energy: 2, happiness: 5 },
    className:
      "border-rose-100 bg-rose-50 text-rose-700 shadow-rose-200/60 hover:bg-rose-100",
  },
  {
    key: "play",
    label: "Play",
    emoji: "🎲",
    mood: "playful",
    message: "Again, again. I found the giggles.",
    delta: { fullness: -8, energy: -10, happiness: 18 },
    className:
      "border-violet-100 bg-violet-50 text-violet-700 shadow-violet-200/60 hover:bg-violet-100",
  },
  {
    key: "sleep",
    label: "Sleep",
    emoji: "🌙",
    mood: "sleepy",
    message: "Tuck me under the moon blanket.",
    delta: { fullness: -4, energy: 26, happiness: 3 },
    className:
      "border-indigo-100 bg-indigo-50 text-indigo-700 shadow-indigo-200/60 hover:bg-indigo-100",
  },
  {
    key: "hug",
    label: "Hug",
    emoji: "🤗",
    mood: "happy",
    message: "That hug made me glow inside.",
    delta: { fullness: -2, energy: 5, happiness: 15 },
    className:
      "border-amber-100 bg-amber-50 text-amber-800 shadow-amber-200/60 hover:bg-amber-100",
  },
];

export default function Home() {
  const [stats, setStats] = useState<PetStats>(initialStats);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const reactionIdRef = useRef(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStats((current) => {
        const fullness = clampStat(current.fullness - 3);
        const energy = clampStat(current.energy - 2);
        const happinessLoss = fullness < 28 || energy < 24 ? 3 : 1;

        return {
          fullness,
          energy,
          happiness: clampStat(current.happiness - happinessLoss),
        };
      });
    }, 5600);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!reaction) {
      return;
    }

    const timeout = window.setTimeout(
      () => setReaction(null),
      reaction.mood === "sleepy" ? 5000 : 4200,
    );

    return () => window.clearTimeout(timeout);
  }, [reaction]);

  const restingMood = useMemo<Mood>(() => {
    if (stats.fullness <= 30) {
      return "hungry";
    }

    if (stats.energy <= 26) {
      return "sleepy";
    }

    if (stats.happiness >= 88 && stats.fullness >= 46 && stats.energy >= 42) {
      return "happy";
    }

    return "idle";
  }, [stats]);

  const mood = reaction?.mood ?? restingMood;
  const speech = reaction?.message ?? moodMessages[restingMood];
  const sprite = sprites[mood];

  const statPills = [
    {
      label: "Happiness",
      emoji: "❤️",
      value: stats.happiness,
      barClassName: "bg-gradient-to-r from-rose-300 to-pink-400",
    },
    {
      label: "Energy",
      emoji: "⚡",
      value: stats.energy,
      barClassName: "bg-gradient-to-r from-amber-300 to-orange-400",
    },
    {
      label: "Fullness",
      emoji: "🍎",
      value: stats.fullness,
      barClassName: "bg-gradient-to-r from-emerald-300 to-teal-400",
    },
  ];

  const handleAction = (action: PetAction) => {
    reactionIdRef.current += 1;

    setStats((current) => ({
      fullness: clampStat(current.fullness + action.delta.fullness),
      energy: clampStat(current.energy + action.delta.energy),
      happiness: clampStat(current.happiness + action.delta.happiness),
    }));

    setReaction({
      id: reactionIdRef.current,
      mood: action.mood,
      message: action.message,
    });
  };

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[radial-gradient(circle_at_50%_0%,#fffaf0_0%,#ffe9ef_42%,#eadfff_100%)] px-4 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-[calc(env(safe-area-inset-top)+0.65rem)] text-[#563744] sm:grid sm:place-items-center">
      <section className="relative mx-auto flex min-h-[calc(100dvh-1.3rem)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/55 p-3.5 shadow-[0_24px_70px_rgba(143,89,122,0.24)] backdrop-blur-xl sm:min-h-[760px] sm:p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-20 h-40 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.86),rgba(255,214,232,0.4)_46%,rgba(255,255,255,0)_72%)] blur-2xl"
        />

        <header className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-black leading-none text-[#4a2d3b]">
              Mileahchi
            </p>
            <p className="mt-1 text-sm font-medium text-[#8f6575]">
              Your tiny forest friend
            </p>
          </div>
          <div className="rounded-full border border-white/70 bg-white/65 px-3 py-1.5 text-xs font-bold text-rose-500 shadow-sm">
            Cozy
          </div>
        </header>

        <div
          aria-label="Mileahchi stats"
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
            key={reaction?.id ?? restingMood}
            aria-live="polite"
            className="companion-bubble-pop relative min-h-[56px] w-full max-w-[17.5rem] rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-center text-sm font-bold leading-snug text-[#624454] shadow-[0_12px_28px_rgba(130,83,109,0.14)]"
          >
            {speech}
            <span
              aria-hidden="true"
              className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-white/80 bg-white/80"
            />
          </div>

          <div className="relative mt-2 flex w-full flex-1 items-end justify-center overflow-visible">
            <div
              aria-hidden="true"
              className="absolute bottom-6 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(255,198,221,0.58)_42%,rgba(196,171,255,0.18)_68%,rgba(255,255,255,0)_76%)] blur-xl"
            />
            <div
              key={`${mood}-${reaction?.id ?? "resting"}`}
              className="companion-float reaction-pop relative z-10"
            >
              <Image
                priority
                src={sprite.src}
                alt={sprite.alt}
                width={1024}
                height={1537}
                sizes="(max-width: 640px) 82vw, 320px"
                className="h-auto w-[clamp(268px,74vw,306px)] max-w-full select-none drop-shadow-[0_26px_28px_rgba(118,70,101,0.24)]"
                draggable={false}
              />
            </div>
          </div>
        </section>

        <div className="relative z-10 mt-auto grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => handleAction(action)}
              className={`flex min-h-[60px] items-center justify-center gap-2 rounded-2xl border px-4 text-base font-black shadow-lg transition duration-150 ease-out active:scale-95 ${action.className}`}
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
