import { authHeaders } from "../features/auth/model/authSession";
import { refreshAuthSession } from "./authApi";
import { isAuthError, readPayload, throwApiError } from "./http";

async function requestVideoLikeStatus(videoId, method) {
  const send = () =>
    fetch(`/api/v1/videos/${videoId}/like`, {
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
    throwApiError(res, payload, "Không cập nhật được trạng thái thích.");
  }

  return payload.data;
}

export function getVideoLikeStatus(videoId) {
  return requestVideoLikeStatus(videoId, "GET");
}

export function likeVideo(videoId) {
  return requestVideoLikeStatus(videoId, "POST");
}

export function unlikeVideo(videoId) {
  return requestVideoLikeStatus(videoId, "DELETE");
}
