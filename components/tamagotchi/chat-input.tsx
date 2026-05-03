import type { FormEvent } from "react";

type ChatInputProps = {
  value: string;
  isSending: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ChatInput({
  value,
  isSending,
  onChange,
  onSubmit,
}: ChatInputProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex min-h-[58px] items-center gap-2 rounded-[1.7rem] border border-white/85 bg-white/78 p-1.5 shadow-[0_14px_32px_rgba(130,83,109,0.16)] backdrop-blur transition focus-within:bg-white/88 focus-within:shadow-[0_16px_36px_rgba(130,83,109,0.22)]"
    >
      <span
        aria-hidden="true"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-2xl text-[#9c8795]"
      >
        ◌
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isSending}
        maxLength={220}
        placeholder="Säg något till Mileahchi..."
        className="min-h-[44px] min-w-0 flex-1 rounded-xl bg-transparent text-sm font-bold text-[#563744] outline-none placeholder:text-[#a77f8e] disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={isSending || value.trim().length === 0}
        className="grid min-h-[46px] min-w-[46px] place-items-center rounded-full bg-gradient-to-br from-violet-400 to-purple-500 text-lg font-black text-white shadow-[0_10px_20px_rgba(133,89,210,0.35)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {isSending ? "..." : "➤"}
      </button>
    </form>
  );
}
