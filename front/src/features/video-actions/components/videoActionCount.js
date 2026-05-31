const DEFAULT_ACTION_COUNT = 1;

export function formatActionCount(value) {
  if (value == null || value === "") {
    return String(DEFAULT_ACTION_COUNT);
  }

  const count = Number(value);
  if (!Number.isFinite(count)) {
    return String(value);
  }

  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1)}M`;
  }

  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(count >= 10_000 ? 0 : 1)}K`;
  }

  return String(count);
}
