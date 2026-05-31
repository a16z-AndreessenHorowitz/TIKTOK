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

export function authHeaders(base = {}) {
  const headers = { ...base }
  const t = getAccessToken()
  if (t) {
    headers.Authorization = `Bearer ${t}`
  }
  return headers
}
