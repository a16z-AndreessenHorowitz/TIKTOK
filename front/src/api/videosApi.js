import { authHeaders } from "../features/auth/model/authSession";
import { refreshAuthSession } from "./authApi";
import { isAuthError, readPayload, throwApiError } from "./http";

function readFeedPage(data) {
  if (Array.isArray(data)) {
    return { items: data, nextCursor: null };
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    nextCursor: typeof data?.nextCursor === "string" && data.nextCursor ? data.nextCursor : null,
  };
}

function buildUploadForm({ file, caption }) {
  const form = new FormData();
  form.append("file", file);
  if (caption?.trim()) {
    form.append("caption", caption.trim());
  }
  return form;
}

export async function fetchVideoFeedPage({ cursor, limit = 8 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set("cursor", cursor);
  }

  const fetchFeed = (withAuth = true) =>
    fetch(`/api/v1/videos/feed?${params}`, {
      headers: withAuth ? authHeaders() : {},
      credentials: "include",
    });

  let res = await fetchFeed();
  let payload = await readPayload(res);

  if (isAuthError(res)) {
    const refreshed = await refreshAuthSession();
    res = await fetchFeed(refreshed);
    payload = await readPayload(res);
  }

  if (!res.ok) {
    throwApiError(res, payload, "Không tải được danh sách video.");
  }

  return readFeedPage(payload.data);
}

export async function uploadVideo({ file, caption }) {
  const postUpload = () =>
    fetch("/api/v1/videos/upload", {
      method: "POST",
      headers: authHeaders(),
      body: buildUploadForm({ file, caption }),
      credentials: "include",
    });

  let res = await postUpload();
  let payload = await readPayload(res);

  if (isAuthError(res)) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      res = await postUpload();
      payload = await readPayload(res);
    }
  }

  if (!res.ok) {
    throwApiError(res, payload, "Tải video lên thất bại.");
  }

  return payload.data;
}
