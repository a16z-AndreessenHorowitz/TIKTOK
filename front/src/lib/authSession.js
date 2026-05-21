const ACCESS_KEY = "tt_access_token"
const USER_KEY = "tt_user"

/** Lưu access JWT (sessionStorage) + user; refresh token chỉ nằm trong cookie httpOnly. */
export function saveSessionFromAuthData(data) {
  if (!data) return
  if (data.accessToken) {
    sessionStorage.setItem(ACCESS_KEY, data.accessToken)
  }
  if (data.user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user))
  }
  window.dispatchEvent(new CustomEvent("tt-auth-changed"))
}

export function clearSession() {
  sessionStorage.removeItem(ACCESS_KEY)
  sessionStorage.removeItem(USER_KEY)
  window.dispatchEvent(new CustomEvent("tt-auth-changed"))
}

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_KEY)
}

export function getUser() {
  const raw = sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** F5: nếu chưa có access, thử refresh bằng cookie. */
export async function bootstrapAuthSession() {
  if (getAccessToken()) return true
  return refreshAuthSession({ clearOnFailure: false })
}

/** Access hết hạn: đổi refresh cookie lấy access mới. */
export async function refreshAuthSession({ clearOnFailure = true } = {}) {
  try {
    const res = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
    if (!res.ok) {
      if (clearOnFailure) clearSession()
      return false
    }
    const payload = await res.json().catch(() => ({}))
    if (payload?.data?.accessToken) {
      saveSessionFromAuthData(payload.data)
      return true
    }
    if (clearOnFailure) clearSession()
    return false
  } catch {
    if (clearOnFailure) clearSession()
    return false
  }
}

export async function authLogout() {
  try {
    await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" })
  } finally {
    clearSession()
  }
}

export function authHeaders(base = {}) {
  const headers = { ...base }
  const t = getAccessToken()
  if (t) {
    headers.Authorization = `Bearer ${t}`
  }
  return headers
}
