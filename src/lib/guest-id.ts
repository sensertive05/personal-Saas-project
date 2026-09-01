const GUEST_ID_STORAGE_KEY = "guest-id";

export function getGuestId(): string {
  const existing = window.localStorage.getItem(GUEST_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const guestId = crypto.randomUUID();
  window.localStorage.setItem(GUEST_ID_STORAGE_KEY, guestId);
  return guestId;
}
