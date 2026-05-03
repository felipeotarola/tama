export const PET_GUEST_ID_STORAGE_KEY = "mileahchi.guest-id.v1";

const GUEST_ID_PATTERN =
  /^guest_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidGuestId(value: unknown): value is string {
  return typeof value === "string" && GUEST_ID_PATTERN.test(value);
}

export function createGuestId() {
  return `guest_${crypto.randomUUID()}`;
}

export function getOrCreateGuestId() {
  const storedGuestId = window.localStorage.getItem(PET_GUEST_ID_STORAGE_KEY);

  if (isValidGuestId(storedGuestId)) {
    return storedGuestId;
  }

  const guestId = createGuestId();
  window.localStorage.setItem(PET_GUEST_ID_STORAGE_KEY, guestId);
  return guestId;
}
