import { NavLink } from "react-router-dom";
import "./css/StudioSidebar.css";

const MANAGE_NAV = [
  { to: "/upload", label: "Trang chủ", icon: "home", end: true },
  { to: "/upload/posts", label: "Bài đăng", icon: "posts" },
  { to: "/upload/analytics", label: "Thống kê", icon: "analytics" },
  { to: "/upload/comments", label: "Bình luận", icon: "comments" },
];

const TOOLS_NAV = [
  { to: "/upload/inspiration", label: "Nguồn cảm hứng", icon: "inspiration" },
  { to: "/upload/monetize", label: "Kiếm tiền", icon: "monetize", badge: true },
  { to: "/upload/academy", label: "Học viện Người sáng tạo", icon: "academy" },
  { to: "/upload/sounds", label: "Âm thanh không giới hạn", icon: "sounds" },
];

const OTHER_NAV = [{ to: "/upload/feedback", label: "Phản hồi", icon: "feedback" }];

function NavIcon({ type }) {
  switch (type) {
    case "home":
      return (
        <svg viewBox="0 0 48 48" width="20" height="20" fill="currentColor" aria-hidden>
          <path d="M24.95 7.84a1.5 1.5 0 0 0-1.9 0l-16.1 13.2a1.5 1.5 0 0 0 .95 2.66h2.33l1.2 13.03A2.5 2.5 0 0 0 13.9 39h7.59a1 1 0 0 0 1-1v-9.68a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V38a1 1 0 0 0 1 1h7.59a2.5 2.5 0 0 0 2.49-2.27l1.19-13.03h2.33a1.5 1.5 0 0 0 .95-2.66l-16.1-13.2Z" />
        </svg>
      );
    case "posts":
      return (
        <svg viewBox="0 0 48 48" width="20" height="20" fill="currentColor" aria-hidden>
          <path d="M11 8a3 3 0 0 0-3 3v26a3 3 0 0 0 3 3h26a3 3 0 0 0 3-3V11a3 3 0 0 0-3-3H11Zm0 4h26v26H11V12Zm6 4h14v2H17v-2Zm0 6h14v2H17v-2Zm0 6h10v2H17v-2Z" />
        </svg>
      );
    case "analytics":
      return (
        <svg viewBox="0 0 48 48" width="20" height="20" fill="currentColor" aria-hidden>
          <path d="M8 36V12h4v24H8Zm12-8V12h4v16h-4Zm12-6V12h4v10h-4Zm12-4V12h4v6h-4Z" />
        </svg>
      );
    case "comments":
      return (
        <svg viewBox="0 0 48 48" width="20" height="20" fill="currentColor" aria-hidden>
          <path d="M8 10a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4h-4.8L18 38.5V28H12a4 4 0 0 1-4-4V10Zm4 0v14h8.2L28 32.1V24h8V10H12Z" />
        </svg>
      );
    case "inspiration":
      return (
        <svg viewBox="0 0 48 48" width="20" height="20" fill="currentColor" aria-hidden>
          <path d="M24 6a2 2 0 0 1 1.8 1.1l2.5 5 5.5.8a2 2 0 0 1 1.1 3.4l-4 3.9.9 5.5a2 2 0 0 1-2.9 2.1L24 25.6l-4.9 2.6a2 2 0 0 1-2.9-2.1l.9-5.5-4-3.9a2 2 0 0 1 1.1-3.4l5.5-.8L22.2 7.1A2 2 0 0 1 24 6Z" />
        </svg>
      );
    case "monetize":
      return (
        <svg viewBox="0 0 48 48" width="20" height="20" fill="currentColor" aria-hidden>
          <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4Zm0 6c7.73 0 14 6.27 14 14s-6.27 14-14 14S10 31.73 10 24 16.27 10 24 10Zm-1 6v12h10v-4H25V16h-2Z" />
        </svg>
      );
    case "academy":
      return (
        <svg viewBox="0 0 48 48" width="20" height="20" fill="currentColor" aria-hidden>
          <path d="M24 8 6 18l18 10 18-10-18-10Zm0 14.6L12.5 18 24 12.4 35.5 18 24 22.6ZM10 24.5v8.8L24 42l14-8.7v-8.8l-6 3.7V32L24 36.5 16 32v-3.8l-6 3.7Z" />
        </svg>
      );
    case "sounds":
      return (
        <svg viewBox="0 0 48 48" width="20" height="20" fill="currentColor" aria-hidden>
          <path d="M16.78 26.82c-.08.18-.08.41-.08.88v3.9c0 .47 0 .7.08.88.1.25.3.44.54.54.18.08.41.08.88.08.47 0 .7 0 .88-.08a1 1 0 0 0 .54-.54c.08-.18.08-.41.08-.88v-3.9c0-.47 0-.7-.08-.88a1 1 0 0 0-.54-.54c-.18-.08-.41-.08-.88-.08-.47 0-.7 0-.88.08a1 1 0 0 0-.54.54ZM22.5 21.4c0-.47 0-.7.08-.88a1 1 0 0 1 .54-.54c.18-.08.41-.08.88-.08.47 0 .7 0 .88.08.25.1.44.3.54.54.08.18.08.41.08.88v10.2c0 .47 0 .7-.08.88a1 1 0 0 1-.54.54c-.18.08-.41.08-.88.08-.47 0-.7 0-.88-.08a1 1 0 0 1-.54-.54c-.08-.18-.08-.41-.08-.88V21.4Z" />
        </svg>
      );
    case "feedback":
      return (
        <svg viewBox="0 0 48 48" width="20" height="20" fill="currentColor" aria-hidden>
          <path d="M8 10a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4h-4.8L18 38.5V28H12a4 4 0 0 1-4-4V10Z" />
        </svg>
      );
    default:
      return null;
  }
}

function StudioNavItem({ to, label, icon, end, badge }) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `studio-sidebar__link${isActive ? " studio-sidebar__link--active" : ""}`
        }
      >
        <span className="studio-sidebar__link-icon">
          <NavIcon type={icon} />
        </span>
        <span className="studio-sidebar__link-label">{label}</span>
        {badge ? <span className="studio-sidebar__badge" aria-label="Thông báo mới" /> : null}
      </NavLink>
    </li>
  );
}

function NavSection({ title, items }) {
  return (
    <div className="studio-sidebar__section">
      <p className="studio-sidebar__section-title">{title}</p>
      <ul className="studio-sidebar__list">
        {items.map((item) => (
          <StudioNavItem key={item.to} {...item} />
        ))}
      </ul>
    </div>
  );
}

export default function StudioSidebar() {
  return (
    <aside className="studio-sidebar">
      <div className="studio-sidebar__brand">
        <svg viewBox="0 0 118 42" height="28" width="78" aria-label="TikTok Studio" className="studio-sidebar__logo">
          <path fill="#25F4EE" d="M9.875 16.842v-1.119A9 9 0 0 0 8.7 15.64c-4.797-.006-8.7 3.9-8.7 8.708a8.7 8.7 0 0 0 3.718 7.134A8.68 8.68 0 0 1 1.38 25.55c0-4.737 3.794-8.598 8.495-8.707" />
          <path fill="#FE2C55" d="M23.992 13.166v3.676c-2.453 0-4.727-.786-6.58-2.116v9.622c0 4.8-3.902 8.713-8.706 8.713a8.67 8.67 0 0 1-4.988-1.579 8.7 8.7 0 0 0 6.368 2.781c4.797 0 8.707-3.906 8.707-8.714v-9.621a11.25 11.25 0 0 0 6.579 2.116v-4.73q-.72-.002-1.38-.148" />
          <path fill="#000" d="M45.73 19.502h4.733v13.553h-4.708zm6.617-6.374h4.733v9.257l4.689-4.61h5.646l-5.934 5.76 6.644 9.52h-5.213l-4.433-6.598-1.405 1.362v5.236H52.34V13.128z" />
        </svg>
        <span className="studio-sidebar__brand-text">Studio</span>
      </div>

      <NavLink to="/upload" className="studio-sidebar__upload-btn">
        <span className="studio-sidebar__upload-icon" aria-hidden>
          +
        </span>
        Tải lên
      </NavLink>

      <nav className="studio-sidebar__nav">
        <NavSection title="QUẢN LÝ" items={MANAGE_NAV} />
        <NavSection title="CÔNG CỤ" items={TOOLS_NAV} />
        <NavSection title="KHÁC" items={OTHER_NAV} />
      </nav>

      <NavLink to="/" className="studio-sidebar__back">
        <i className="fa-solid fa-arrow-left" aria-hidden />
        Quay lại TikTok
      </NavLink>
    </aside>
  );
}
