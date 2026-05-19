import { authHeaders } from "./authSession";

export async function uploadVideo({ file, caption }) {
  const form = new FormData();
  form.append("file", file);
  if (caption?.trim()) {
    form.append("caption", caption.trim());
  }

  const res = await fetch("/api/v1/videos/upload", {
    method: "POST",
    headers: authHeaders(),
    body: form,
    credentials: "include",
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.message || "Tải video lên thất bại.");
  }
  return payload.data;
}
