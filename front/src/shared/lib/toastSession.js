const TOAST_KEY = "tt-pending-toast";

export function queueToast(toast) {
  sessionStorage.setItem(TOAST_KEY, JSON.stringify(toast));
}

export function consumeToast() {
  const raw = sessionStorage.getItem(TOAST_KEY);
  if (!raw) return null;

  sessionStorage.removeItem(TOAST_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
