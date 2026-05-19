import defaultAvatar from "../assets/images/user.png"

/** Ảnh đại diện: URL người dùng hoặc mặc định trong assets. */
export function getUserAvatarSrc(user) {
  const url = user?.avatarUrl
  if (typeof url === "string" && url.trim()) {
    return url.trim()
  }
  return defaultAvatar
}

export { defaultAvatar }
