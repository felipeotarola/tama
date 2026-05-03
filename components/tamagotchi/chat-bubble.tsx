import type { ChatMessageDTO } from "@/lib/tamagotchi/api-types";

type ChatBubbleProps = {
  message: Pick<ChatMessageDTO, "role" | "content" | "id">;
  faded?: boolean;
};

export function ChatBubble({ message, faded = false }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`companion-chat-bubble flex w-full ${
        isUser ? "justify-end" : "justify-start"
      } ${faded ? "opacity-70" : "opacity-100"}`}
    >
      <div
        className={`max-w-[78%] rounded-[1.35rem] px-3.5 py-2.5 text-[13px] font-black leading-snug shadow-[0_10px_24px_rgba(122,80,112,0.12)] backdrop-blur ${
          isUser
            ? "rounded-br-md border border-purple-100/80 bg-purple-100/78 text-[#624070]"
            : "rounded-bl-md border border-white/80 bg-white/82 text-[#563744]"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
