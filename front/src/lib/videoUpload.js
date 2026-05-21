import { authHeaders, refreshAuthSession } from "./authSession";

export async function uploadVideo({ file, caption }) {
  const buildForm = () => {
    const form = new FormData();
    form.append("file", file);
    if (caption?.trim()) {
      form.append("caption", caption.trim());
    }
    return form;
  };

  const postUpload = () => fetch("/api/v1/videos/upload", {
    method: "POST",
    headers: authHeaders(),
    body: buildForm(),
    credentials: "include",
  });

  let res = await postUpload();
  let payload = await res.json().catch(() => ({}));

  if (res.status === 401 || res.status === 403) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      res = await postUpload();
      payload = await res.json().catch(() => ({}));
    }
  }

  if (!res.ok) {
    throw new Error(payload?.message || "Tải video lên thất bại.");
  }
  return payload.data;
}
