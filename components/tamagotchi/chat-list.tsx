"use client";

import { useEffect, useRef } from "react";

import { ChatBubble } from "@/components/tamagotchi/chat-bubble";
import type { ChatMessageDTO } from "@/lib/tamagotchi/api-types";

type ChatListProps = {
  messages: ChatMessageDTO[];
  isThinking: boolean;
};

const THINKING_MESSAGE = {
  id: "mileahchi-thinking",
  role: "assistant" as const,
  content: "Mileahchi funderar...",
};

export function ChatList({ messages, isThinking }: ChatListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibleMessages = messages
    .filter((message) => message.role !== "system")
    .slice(-5);
  const stream = isThinking
    ? [...visibleMessages, THINKING_MESSAGE]
    : visibleMessages;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [stream.length]);

  if (stream.length === 0) {
    return null;
  }

  return (
    <div
      ref={scrollRef}
      aria-label="Senaste prat med Mileahchi"
      className="relative z-20 mt-1 flex max-h-[7.25rem] w-full flex-col gap-1.5 overflow-y-auto px-1 pb-1 pt-2 [mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_100%)]"
    >
      {stream.map((message, index) => (
        <ChatBubble
          key={message.id}
          message={message}
          faded={index < stream.length - 3}
        />
      ))}
    </div>
  );
}
