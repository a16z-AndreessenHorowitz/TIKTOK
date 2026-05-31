import { authHeaders } from "../features/auth/model/authSession";
import { refreshAuthSession } from "./authApi";
import { isAuthError, readPayload, throwApiError } from "./http";

export async function fetchVideoComments(videoId, { beforeCommentId, limit } = {}) {
  const params = new URLSearchParams();
  if (beforeCommentId != null) {
    params.set("beforeCommentId", String(beforeCommentId));
  }
  if (limit != null) {
    params.set("limit", String(limit));
  }

  const query = params.toString();
  const res = await fetch(`/api/v1/videos/${videoId}/comments${query ? `?${query}` : ""}`, {
    credentials: "include",
  });
  const payload = await readPayload(res);

  if (!res.ok) {
    throwApiError(res, payload, "Không tải được bình luận.");
  }

  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function createVideoComment(videoId, { content, parentCommentId } = {}) {
  const postComment = () =>
    fetch(`/api/v1/videos/${videoId}/comments`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ content, parentCommentId }),
      credentials: "include",
    });

  let res = await postComment();
  let payload = await readPayload(res);

  if (isAuthError(res)) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      res = await postComment();
      payload = await readPayload(res);
    }
  }

  if (!res.ok) {
    throwApiError(res, payload, "Không gửi được bình luận.");
  }

  return payload.data;
}
