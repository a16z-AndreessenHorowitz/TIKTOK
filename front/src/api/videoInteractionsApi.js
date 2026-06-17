import { authHeaders } from "../features/auth/model/authSession";
import { refreshAuthSession } from "./authApi";
import { isAuthError, readPayload, throwApiError } from "./http";

async function requestWithAuthRetry(send, fallbackMessage) {
  let res = await send();
  let payload = await readPayload(res);

  if (isAuthError(res)) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      res = await send();
      payload = await readPayload(res);
    }
  }

  if (!res.ok) {
    throwApiError(res, payload, fallbackMessage);
  }

  return payload.data;
}

export function recordVideoView(videoId, watchTime, { keepalive = false } = {}) {
  return requestWithAuthRetry(
    () =>
      fetch(`/api/v1/videos/${videoId}/interactions/view`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ watchTime }),
        credentials: "include",
        keepalive,
      }),
    "Không ghi nhận được lượt xem video.",
  );
}

/**
 * Gửi batch watch-time — 1 request thay vì N request mỗi phiên xem.
 * @param {Array<{videoId: number, watchTime: number}>} items
 */
export function recordVideoViewBatch(items, { keepalive = false } = {}) {
  if (!items || items.length === 0) return Promise.resolve(null);
  return requestWithAuthRetry(
    () =>
      fetch("/api/v1/videos/interactions/view/batch", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ items }),
        credentials: "include",
        keepalive,
      }),
    "Không ghi nhận được lượt xem video.",
  );
}


export function recordVideoShare(videoId) {
  return requestWithAuthRetry(
    () =>
      fetch(`/api/v1/videos/${videoId}/share`, {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
      }),
    "Không ghi nhận được lượt chia sẻ.",
  );
}
