import { isSupabaseServerConfigured } from "@/lib/supabase/server";
import type { PetLoadResponse } from "@/lib/tamagotchi/api-types";
import {
  initialPetState,
  parsePetState,
} from "@/lib/tamagotchi/pet-state";
import {
  loadOrCreateGuestPet,
  loadRecentChatMessages,
} from "@/lib/tamagotchi/pet-storage";
import { isValidGuestId } from "@/lib/tamagotchi/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readBody(request);
  const guestId = typeof body?.guestId === "string" ? body.guestId : "";
  const clientPet = parsePetState(body?.clientPet) ?? initialPetState;

  if (!isValidGuestId(guestId)) {
    return Response.json({ error: "Ogiltig Mileahchi-session." }, { status: 400 });
  }

  if (!isSupabaseServerConfigured()) {
    return Response.json({
      pet: clientPet,
      messages: [],
      storage: "local",
      notice: "Mileahchi sparar på den här enheten just nu.",
    } satisfies PetLoadResponse);
  }

  try {
    const profile = await loadOrCreateGuestPet(guestId, clientPet);
    const messages = await loadRecentChatMessages(profile.id);

    return Response.json({
      pet: profile.pet,
      messages,
      storage: "supabase",
    } satisfies PetLoadResponse);
  } catch (error) {
    console.error("Failed to load Mileahchi pet profile.", error);

    return Response.json({
      pet: clientPet,
      messages: [],
      storage: "local",
      notice: "Mileahchi sparar lokalt tills molnet vaknar igen.",
    } satisfies PetLoadResponse);
  }
}

async function readBody(request: Request) {
  return (await request.json().catch(() => null)) as
    | { guestId?: unknown; clientPet?: unknown }
    | null;
}
