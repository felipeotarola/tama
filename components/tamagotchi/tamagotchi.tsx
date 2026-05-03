"use client";

import Image from "next/image";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { ActionDock } from "@/components/tamagotchi/action-dock";
import { ChatDock } from "@/components/tamagotchi/chat-dock";
import { ChatList } from "@/components/tamagotchi/chat-list";
import { LevelBar } from "@/components/tamagotchi/level-bar";
import { SpeechBubble } from "@/components/tamagotchi/speech-bubble";
import { StatsPanel } from "@/components/tamagotchi/stats-panel";
import { useSpriteAnimation } from "@/hooks/use-sprite-animation";
import {
  ALL_SPRITE_FRAMES,
  DEFAULT_ANIMATION_BY_MOOD,
  SPRITE_ANIMATIONS,
  type SpriteAnimationName,
} from "@/lib/tamagotchi/animation-data";
import {
  loadPetProfile,
  savePetAction,
  sendChatMessage,
} from "@/lib/tamagotchi/api-client";
import type { ChatMessageDTO } from "@/lib/tamagotchi/api-types";
import {
  applyPetAction,
  decayPetState,
  initialPetState,
  moodMessages,
  PET_DECAY_INTERVAL_MS,
  PET_STATE_STORAGE_KEY,
  restorePetState,
  serializePetState,
  type PetActionName,
  type PetState,
} from "@/lib/tamagotchi/pet-state";
import { getOrCreateGuestId } from "@/lib/tamagotchi/session";

type SpeechState = {
  id: number;
  text: string;
  source: "mood" | "action" | "chat";
};

const moodLabels: Record<PetState["mood"], string> = {
  idle: "Mysig",
  happy: "Glittrig",
  hungry: "Sugen",
  sleepy: "Sömnig",
  playful: "Busig",
};

const THINKING_MESSAGE = "Mileahchi tänker...";
const CHAT_ERROR_MESSAGE = "Hmm... jag blev lite sömnig. Kan du säga det igen?";

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
  const [guestId, setGuestId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessageDTO[]>([]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const speechIdRef = useRef(0);
  const requestIdRef = useRef(0);
  const hasRestoredPetRef = useRef(false);

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
    const timer = window.setTimeout(() => {
      const restoredPet = restorePetState(
        window.localStorage.getItem(PET_STATE_STORAGE_KEY),
      );
      const nextPet = restoredPet ?? initialPetState;
      const nextGuestId = getOrCreateGuestId();

      hasRestoredPetRef.current = true;
      setGuestId(nextGuestId);
      setPet(nextPet);

      if (!restoredPet) {
        window.localStorage.setItem(
          PET_STATE_STORAGE_KEY,
          serializePetState(nextPet),
        );
      }

      loadPetProfile({ guestId: nextGuestId, clientPet: nextPet })
        .then((response) => {
          setPet(response.pet);
          setChatMessages(response.messages);
          setSyncNotice(response.notice ?? null);
          const latestAssistantMessage = getLatestAssistantMessage(
            response.messages,
          );

          if (latestAssistantMessage) {
            speechIdRef.current += 1;
            setSpeech({
              id: speechIdRef.current,
              text: latestAssistantMessage.content,
              source: "chat",
            });
          }
        })
        .catch(() => {
          setSyncNotice("Mileahchi sparar på den här enheten just nu.");
        });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasRestoredPetRef.current) {
      return;
    }

    window.localStorage.setItem(PET_STATE_STORAGE_KEY, serializePetState(pet));
  }, [pet]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPet((current) => decayPetState(current));
    }, PET_DECAY_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (speech.source !== "mood") {
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

  const triggerAnimation = useCallback((name: SpriteAnimationName) => {
    requestIdRef.current += 1;
    setAnimationRequest({
      id: requestIdRef.current,
      name,
      mode: "once",
    });
  }, []);

  const showSpeech = useCallback(
    (text: string, source: SpeechState["source"] = "action") => {
      speechIdRef.current += 1;
      setSpeech({
        id: speechIdRef.current,
        text,
        source,
      });
    },
    [],
  );

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

  const handleAction = (actionName: PetActionName) => {
    const actionTime = Date.now();
    const result = applyPetAction(pet, actionName, actionTime);

    setPet(result.pet);
    setNow(actionTime);
    triggerAnimation(result.animation);
    showSpeech(result.message);

    if (!guestId) {
      setSyncNotice("Mileahchi sparar på den här enheten just nu.");
      return;
    }

    savePetAction({
      guestId,
      action: actionName,
      clientPet: pet,
    })
      .then((response) => {
        setPet(response.pet);
        setSyncNotice(response.notice ?? null);
      })
      .catch(() => {
        setSyncNotice("Mileahchi sparar lokalt tills molnet vaknar igen.");
      });
  };

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = chatInput.trim();

    if (!message || isSendingChat) {
      return;
    }

    const activeGuestId = guestId ?? getOrCreateGuestId();
    const startedAt = Date.now();
    const outgoingMessage: ChatMessageDTO = {
      id: `local-user-${startedAt}`,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };

    if (!guestId) {
      setGuestId(activeGuestId);
    }

    setChatInput("");
    setIsSendingChat(true);
    setChatMessages((current) => [...current, outgoingMessage].slice(-12));
    showSpeech(THINKING_MESSAGE, "chat");

    sendChatMessage({
      guestId: activeGuestId,
      message,
      clientPet: pet,
      clientMessages: chatMessages.slice(-10),
    })
      .then(async (response) => {
        await wait(Math.max(0, 650 - (Date.now() - startedAt)));
        setPet(response.pet);
        setChatMessages(response.messages);
        setSyncNotice(response.notice ?? null);
        showSpeech(response.message, "chat");
        triggerAnimation(response.animation);
      })
      .catch(() => {
        const fallbackMessage: ChatMessageDTO = {
          id: `local-assistant-${Date.now()}`,
          role: "assistant",
          content: CHAT_ERROR_MESSAGE,
          createdAt: new Date().toISOString(),
        };

        setChatMessages((current) =>
          [...current, fallbackMessage].slice(-12),
        );
        setSyncNotice("Mileahchi tappade molnkontakten en stund.");
        showSpeech(CHAT_ERROR_MESSAGE, "chat");
      })
      .finally(() => {
        setIsSendingChat(false);
      });
  };

  return (
    <main className="relative flex h-dvh items-stretch justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_8%,#fff8d9_0%,#ffdce8_38%,#dbc9ff_100%)] px-[clamp(0.55rem,3vw,1rem)] pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-[calc(env(safe-area-inset-top)+0.5rem)] text-[#563744] sm:items-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_22%_72%,rgba(116,185,130,0.34),transparent_22%),radial-gradient(circle_at_86%_70%,rgba(93,165,124,0.28),transparent_21%),radial-gradient(circle_at_50%_46%,rgba(255,245,170,0.5),transparent_30%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -left-12 bottom-20 h-28 w-28 rounded-full bg-[radial-gradient(circle_at_45%_40%,#fff7f9_0_22%,#ff8aa4_23%_45%,#f56d8e_46%_100%)] opacity-70 blur-[0.2px]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-10 bottom-32 h-24 w-32 rounded-[2rem] bg-amber-200/35 blur-sm"
      />

      <section className="relative mx-auto grid h-full min-h-0 w-full max-w-md grid-rows-[auto_auto_minmax(0,1fr)_auto_auto_auto] gap-[clamp(0.45rem,1.4dvh,0.65rem)] overflow-hidden px-[clamp(0.25rem,1vw,0.5rem)] sm:max-h-[820px]">
        <div
          aria-hidden="true"
          className="companion-glow pointer-events-none absolute inset-x-8 top-36 h-56 rounded-full bg-[radial-gradient(circle,rgba(255,255,210,0.72),rgba(255,209,229,0.4)_46%,rgba(255,255,255,0)_72%)] blur-2xl"
        />

        <header className="relative z-10 grid grid-cols-[3rem_minmax(0,1fr)_4.75rem] items-start gap-2 pt-2">
          <button
            type="button"
            aria-label="Meny"
            className="grid h-12 w-12 place-items-center rounded-full border border-white/70 bg-white/68 text-2xl font-black text-[#65445d] shadow-[0_10px_24px_rgba(122,80,112,0.14)] backdrop-blur active:scale-95"
          >
            ≡
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-[clamp(1.8rem,9vw,2.45rem)] font-black leading-none text-[#55355f] drop-shadow-[0_2px_0_rgba(255,255,255,0.55)]">
              Mileahchi
            </p>
            <p className="mt-1 truncate text-[clamp(0.95rem,4.5vw,1.2rem)] font-black text-[#a7798f]">
              Din lilla skogsvän
            </p>
          </div>
          <div className="shrink-0 rounded-full border border-white/75 bg-white/75 px-2.5 py-2 text-[11px] font-black text-rose-500 shadow-[0_10px_24px_rgba(122,80,112,0.14)] backdrop-blur">
            <span aria-hidden="true">✦ </span>
            {moodLabels[pet.mood]}
          </div>
        </header>

        <StatsPanel pet={pet} />

        <section className="relative z-10 flex min-h-0 flex-col items-center justify-center">
          <SpeechBubble id={speech.id} text={speech.text} />

          <div className="relative mt-1 flex min-h-0 w-full flex-1 items-center justify-center overflow-visible">
            <div
              aria-hidden="true"
              className="companion-glow absolute h-[min(78vw,20rem)] w-[min(78vw,20rem)] rounded-full bg-[radial-gradient(circle,rgba(255,247,173,0.62)_0%,rgba(255,204,226,0.45)_44%,rgba(196,171,255,0.18)_70%,rgba(255,255,255,0)_76%)] blur-xl"
            />
            <div className="companion-float relative z-10 h-full max-h-[390px] min-h-[230px] w-[min(86vw,340px)]">
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

          <ChatList messages={chatMessages} isThinking={isSendingChat} />
        </section>

        <LevelBar pet={pet} />

        <ChatDock
          input={chatInput}
          notice={syncNotice}
          isSending={isSendingChat}
          onInputChange={setChatInput}
          onSubmit={handleChatSubmit}
        />

        <ActionDock pet={pet} now={now} onAction={handleAction} />
      </section>
    </main>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getLatestAssistantMessage(messages: ChatMessageDTO[]) {
  return [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
}
