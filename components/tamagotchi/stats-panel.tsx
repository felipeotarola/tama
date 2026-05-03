import { getFullness, type PetState } from "@/lib/tamagotchi/pet-state";

type StatsPanelProps = {
  pet: PetState;
};

export function StatsPanel({ pet }: StatsPanelProps) {
  const stats = [
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
      barClassName: "bg-gradient-to-r from-yellow-300 to-orange-400",
    },
    {
      label: "Mätt",
      emoji: "🍎",
      value: getFullness(pet.stats),
      barClassName: "bg-gradient-to-r from-emerald-300 to-teal-400",
    },
  ];

  return (
    <div
      aria-label="Mileahchis status"
      className="relative z-10 grid grid-cols-3 gap-2"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="min-w-0 rounded-[1.35rem] border border-white/70 bg-white/62 px-2.5 py-2.5 shadow-[0_10px_24px_rgba(122,80,112,0.12)] backdrop-blur"
        >
          <div className="flex items-center justify-between gap-1 text-[11px] font-black text-[#5b3a55]">
            <span className="min-w-0 truncate">
              <span aria-hidden="true">{stat.emoji}</span> {stat.label}
            </span>
            <span>{stat.value}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f5e2e9]">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${stat.barClassName}`}
              style={{ width: `${stat.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
