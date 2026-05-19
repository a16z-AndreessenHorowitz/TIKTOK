export async function uploadVideoToImageKit(file, folder) {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) formData.append("folder", folder);

  const res = await fetch("/api/v1/imagekit/upload", {
    method: "POST",
    body: formData,
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.message || "Tải video lên thất bại.");
  }

  return payload.data;
}
