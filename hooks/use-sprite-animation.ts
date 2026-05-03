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
    const animation = animations[playback.name];
    const timer = window.setTimeout(() => {
      const nextFrame = playback.frameIndex + 1;

      if (nextFrame < animation.frames.length) {
        setPlayback({ ...playback, frameIndex: nextFrame });
        return;
      }

      if (playback.mode === "once") {
        setPlayback({
          name: defaultAnimation,
          frameIndex: 0,
          mode: "loop",
          requestId: null,
        });

        if (playback.requestId !== null) {
          onRequestComplete?.(playback.requestId);
        }

        return;
      }

      setPlayback({ ...playback, frameIndex: 0 });
    }, animation.frameMs);

    return () => window.clearTimeout(timer);
  }, [animations, defaultAnimation, onRequestComplete, playback]);

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
