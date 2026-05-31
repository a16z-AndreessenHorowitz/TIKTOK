import { useCallback, useEffect, useState } from "react"
import { getAccessToken, getUser } from "../model/authSession"

/** Đồng bộ trạng thái đăng nhập khi session thay đổi (login / logout / refresh). */
export function useAuth() {
  const read = useCallback(
    () => ({
      isLoggedIn: Boolean(getAccessToken()),
      user: getUser(),
    }),
    [],
  )

  const [auth, setAuth] = useState(read)

  useEffect(() => {
    const sync = () => setAuth(read())
    window.addEventListener("tt-auth-changed", sync)
    return () => window.removeEventListener("tt-auth-changed", sync)
  }, [read])

  return auth
}
