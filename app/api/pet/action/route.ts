import { isSupabaseServerConfigured } from "@/lib/supabase/server";
import type { PetActionResponse } from "@/lib/tamagotchi/api-types";
import {
  applyPetAction,
  initialPetState,
  parsePetState,
  PET_ACTIONS,
} from "@/lib/tamagotchi/pet-state";
import {
  insertPetEvent,
  loadOrCreateGuestPet,
  updateGuestPet,
} from "@/lib/tamagotchi/pet-storage";
import { isValidGuestId } from "@/lib/tamagotchi/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readBody(request);
  const guestId = typeof body?.guestId === "string" ? body.guestId : "";
  const actionName =
    typeof body?.action === "string" ? body.action : "";
  const action = PET_ACTIONS.find((item) => item.name === actionName);
  const clientPet = parsePetState(body?.clientPet) ?? initialPetState;

  if (!isValidGuestId(guestId)) {
    return Response.json({ error: "Ogiltig Mileahchi-session." }, { status: 400 });
  }

  if (!action) {
    return Response.json({ error: "Okänd Mileahchi-handling." }, { status: 400 });
  }

  if (!isSupabaseServerConfigured()) {
    return Response.json({
      ...applyPetAction(clientPet, action.name),
      storage: "local",
      notice: "Mileahchi sparar på den här enheten just nu.",
    } satisfies PetActionResponse);
  }

  try {
    const profile = await loadOrCreateGuestPet(guestId, clientPet);
    const result = applyPetAction(profile.pet, action.name);

    await updateGuestPet(profile.id, result.pet);
    await insertPetEvent(
      profile.id,
      action.name,
      result.statDelta,
      result.message,
      result.xpGained,
    );

    return Response.json({
      ...result,
      storage: "supabase",
    } satisfies PetActionResponse);
  } catch (error) {
    console.error("Failed to save Mileahchi pet action.", error);

    return Response.json({
      ...applyPetAction(clientPet, action.name),
      storage: "local",
      notice: "Mileahchi sparar lokalt tills molnet vaknar igen.",
    } satisfies PetActionResponse);
  }
}

async function readBody(request: Request) {
  return (await request.json().catch(() => null)) as
    | {
        guestId?: unknown;
        action?: unknown;
        clientPet?: unknown;
      }
    | null;
}
