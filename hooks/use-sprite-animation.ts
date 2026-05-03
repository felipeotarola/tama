import { useEffect, useMemo, useState } from "react";

import type {
  SpriteAnimationDefinition,
  SpriteAnimationName,
} from "@/lib/tamagotchi/animation-data";

export type AnimationMode = "loop" | "once";

export type AnimationRequest = {
  id: number;
  name: SpriteAnimationName;
  mode: AnimationMode;
};

type SpritePlayback = {
  name: SpriteAnimationName;
  frameIndex: number;
  mode: AnimationMode;
  requestId: number | null;
};

type SpriteAnimationOptions = {
  animations: Record<SpriteAnimationName, SpriteAnimationDefinition>;
  defaultAnimation: SpriteAnimationName;
  request: AnimationRequest | null;
  onRequestComplete?: (requestId: number) => void;
};

export function useSpriteAnimation({
  animations,
  defaultAnimation,
  request,
  onRequestComplete,
}: SpriteAnimationOptions) {
  const [playback, setPlayback] = useState<SpritePlayback>({
    name: defaultAnimation,
    frameIndex: 0,
    mode: "loop",
    requestId: null,
  });

  useEffect(() => {
    if (!request) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPlayback({
        name: request.name,
        frameIndex: 0,
        mode: request.mode,
        requestId: request.id,
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [request]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPlayback((current) => {
        if (current.mode === "once" || current.name === defaultAnimation) {
          return current;
        }

        return {
          name: defaultAnimation,
          frameIndex: 0,
          mode: "loop",
          requestId: null,
        };
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [defaultAnimation]);

  useEffect(() => {
    const frameMs = animations[playback.name].frameMs;
    const interval = window.setInterval(() => {
      setPlayback((current) => {
        const animation = animations[current.name];
        const nextFrame = current.frameIndex + 1;

        if (nextFrame < animation.frames.length) {
          return { ...current, frameIndex: nextFrame };
        }

        if (current.mode === "once") {
          if (current.requestId !== null) {
            const completedRequestId = current.requestId;
            window.setTimeout(
              () => onRequestComplete?.(completedRequestId),
              0,
            );
          }

          return {
            name: defaultAnimation,
            frameIndex: 0,
            mode: "loop",
            requestId: null,
          };
        }

        return { ...current, frameIndex: 0 };
      });
    }, frameMs);

    return () => window.clearInterval(interval);
  }, [animations, defaultAnimation, onRequestComplete, playback.name]);

  return useMemo(() => {
    const animation = animations[playback.name];
    const frame = animation.frames[playback.frameIndex] ?? animation.frames[0];

    return {
      animationName: playback.name,
      frame,
      frameIndex: playback.frameIndex,
      isReaction: playback.mode === "once",
      alt: animation.alt,
    };
  }, [animations, playback]);
}
