import { authHeaders } from "../features/auth/model/authSession";
import { refreshAuthSession } from "./authApi";
import { isAuthError, readPayload, throwApiError } from "./http";

async function requestFollowStatus(userId, method) {
  const send = () =>
    fetch(`/api/v1/users/${userId}/follow`, {
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
    throwApiError(res, payload, "Không cập nhật được trạng thái follow.");
  }

  return payload.data;
}

export function getFollowStatus(userId) {
  return requestFollowStatus(userId, "GET");
}

export function followUser(userId) {
  return requestFollowStatus(userId, "POST");
}

export function unfollowUser(userId) {
  return requestFollowStatus(userId, "DELETE");
}
