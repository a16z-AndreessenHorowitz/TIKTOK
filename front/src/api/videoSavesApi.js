import { authHeaders } from "../features/auth/model/authSession";
import { refreshAuthSession } from "./authApi";
import { isAuthError, readPayload, throwApiError } from "./http";

async function requestVideoSaveStatus(videoId, method) {
  const send = () =>
    fetch(`/api/v1/videos/${videoId}/save`, {
      method,
      headers: authHeaders(),
      credentials: "include",
    });

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
    throwApiError(res, payload, "Không cập nhật được trạng thái lưu video.");
  }

  return payload.data;
}

export function saveVideo(videoId) {
  return requestVideoSaveStatus(videoId, "POST");
}

export function unsaveVideo(videoId) {
  return requestVideoSaveStatus(videoId, "DELETE");
}
