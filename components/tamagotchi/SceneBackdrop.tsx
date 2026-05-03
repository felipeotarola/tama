"use client";

import { useEffect, useState } from "react";

import type { PetScenePresentation } from "@/lib/pet/pet-scenes";

type SceneBackdropProps = {
  presentation: PetScenePresentation;
};

type BackdropLayer = {
  id: number;
  background: string;
  position: string;
  leaving: boolean;
};

export function SceneBackdrop({ presentation }: SceneBackdropProps) {
  const [layers, setLayers] = useState<BackdropLayer[]>([
    {
      id: 0,
      background: presentation.background,
      position: presentation.position,
      leaving: false,
    },
  ]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLayers((current) => {
        const latest = current.at(-1);

        if (
          latest?.background === presentation.background &&
          latest.position === presentation.position
        ) {
          return current;
        }

        return [
          ...(latest ? [{ ...latest, leaving: true }] : []),
          {
            id: (latest?.id ?? 0) + 1,
            background: presentation.background,
            position: presentation.position,
            leaving: false,
          },
        ];
      });
    });

    const timeout = window.setTimeout(() => {
      setLayers((current) => current.slice(-1));
    }, 760);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [presentation.background, presentation.position]);

  return (
    <>
      {layers.map((layer) => (
        <div
          key={layer.id}
          aria-hidden="true"
          className={`absolute inset-0 bg-cover transition-opacity duration-700 ease-out ${
            layer.leaving ? "opacity-0" : "opacity-100"
          }`}
          style={{
            backgroundImage: `url(${layer.background})`,
            backgroundPosition: layer.position,
          }}
        />
      ))}
    </>
  );
}
