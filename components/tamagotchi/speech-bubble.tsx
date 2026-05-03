type SpeechBubbleProps = {
  id: number;
  text: string;
};

export function SpeechBubble({ id, text }: SpeechBubbleProps) {
  return (
    <div
      key={id}
      aria-live="polite"
      className="companion-bubble-pop relative min-h-[64px] w-full max-w-[21rem] rounded-[2rem] border border-white/80 bg-white/82 px-5 py-3 text-center text-base font-black leading-snug text-[#5d3a56] shadow-[0_16px_34px_rgba(122,80,112,0.16)] backdrop-blur"
    >
      <span aria-hidden="true" className="absolute left-5 top-4 text-rose-200">
        ✦
      </span>
      <span className="relative z-10">{text}</span>
      <span aria-hidden="true" className="absolute right-6 top-5 text-amber-200">
        ✨
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-2 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 border-b border-r border-white/80 bg-white/82"
      />
    </div>
  );
}
