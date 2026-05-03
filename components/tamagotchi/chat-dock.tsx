import type { FormEvent } from "react";

import { ChatInput } from "@/components/tamagotchi/chat-input";

type ChatDockProps = {
  input: string;
  notice: string | null;
  isSending: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ChatDock({
  input,
  notice,
  isSending,
  onInputChange,
  onSubmit,
}: ChatDockProps) {
  return (
    <div className="relative z-20">
      {notice ? (
        <p className="mb-1 text-center text-[11px] font-bold text-[#9a6c79]">
          {notice}
        </p>
      ) : null}

      <ChatInput
        value={input}
        isSending={isSending}
        onChange={onInputChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}
