import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { authLogout } from "../../api/authApi";
import { getUserAvatarSrc } from "../../shared/lib/userAvatar";
import "../../styles/AccountMenu.css";

function AccountMenu({ user }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const avatarSrc = getUserAvatarSrc(user);
  const profilePath = user?.username ? `/@${encodeURIComponent(user.username)}` : "/";

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await authLogout();
    navigate("/");
  };

  return (
    <div className="AccountMenu" ref={menuRef}>
      <button
        type="button"
        className="AccountMenu__avatar-btn"
        aria-label="Mở menu tài khoản"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        <img className="AccountMenu__avatar" src={avatarSrc} alt="" />
      </button>

      {isMenuOpen ? (
        <div className="AccountMenu__menu" role="menu">
          <Link
            to={profilePath}
            className="AccountMenu__item"
            role="menuitem"
            onClick={() => setIsMenuOpen(false)}
          >
            <svg fill="none" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden>
              <path
                d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Xem hồ sơ</span>
          </Link>
          <button type="button" className="AccountMenu__item" role="menuitem" onClick={handleLogout}>
            <svg fill="none" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden>
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default AccountMenu;
