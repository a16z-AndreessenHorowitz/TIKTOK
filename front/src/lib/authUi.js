/** Mở popup đăng nhập (Sidebar lắng nghe sự kiện này). */
export function openLoginModal() {
  window.dispatchEvent(new CustomEvent("tt-open-login"))
}
