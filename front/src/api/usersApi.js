import { authHeaders } from "../features/auth/model/authSession";
import { refreshAuthSession } from "./authApi";
import { isAuthError, readPayload, throwApiError } from "./http";

export async function fetchUserProfile(username, { limit = 48 } = {}) {
  const normalizedUsername = String(username || "").replace(/^@+/, "").trim();
  const params = new URLSearchParams({ limit: String(limit) });

  const fetchProfile = (withAuth = true) =>
    fetch(`/api/v1/users/${encodeURIComponent(normalizedUsername)}/profile?${params}`, {
      headers: withAuth ? authHeaders() : {},
      credentials: "include",
    });

  let res = await fetchProfile();
  let payload = await readPayload(res);

  if (isAuthError(res)) {
    const refreshed = await refreshAuthSession();
    res = await fetchProfile(refreshed);
    payload = await readPayload(res);
  }

  if (!res.ok) {
    throwApiError(res, payload, "Không tải được hồ sơ.");
  }

  return payload.data;
}

export async function updateMyProfile({ username, displayName, bio, avatarFile }) {
  const patchProfile = () => {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("displayName", displayName);
    formData.append("bio", bio || "");
    if (avatarFile instanceof File) {
      formData.append("avatar", avatarFile);
    }

    return fetch("/api/v1/users/me/profile", {
      method: "PATCH",
      headers: authHeaders(),
      credentials: "include",
      body: formData,
    });
  };

  let res = await patchProfile();
  let payload = await readPayload(res);

  if (isAuthError(res)) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      res = await patchProfile();
      payload = await readPayload(res);
    }
  }

  if (!res.ok) {
    throwApiError(res, payload, "Không lưu được hồ sơ.");
  }

  return payload.data;
}
