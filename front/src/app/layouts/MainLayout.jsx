import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { bootstrapAuthSession } from "../../api/authApi";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { openLoginModal } from "../../features/auth/model/authUi";
import Sidebar from "../../widgets/sidebar/Sidebar";
import TopRightActionBar from "../../widgets/top-right-action-bar/TopRightActionBar";
import "../../styles/MainLayout.css"

function HomeIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path d="M24.95 7.84a1.5 1.5 0 0 0-1.9 0l-16.1 13.2a1.5 1.5 0 0 0 .95 2.66h2.33l1.2 13.03A2.5 2.5 0 0 0 13.9 39h7.59a1 1 0 0 0 1-1v-9.68a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V38a1 1 0 0 0 1 1h7.59a2.5 2.5 0 0 0 2.49-2.27l1.19-13.03h2.33a1.5 1.5 0 0 0 .95-2.66l-16.1-13.2Z" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path d="M24 8a16 16 0 0 1 14.2 8.63l2.03-4.12a1.5 1.5 0 0 1 2.7 1.32l-3.88 7.87a2 2 0 0 1-2.62.94l-7.92-3.46a1.5 1.5 0 1 1 1.2-2.75l4.46 1.95A12 12 0 1 0 35.2 31.3a2 2 0 1 1 3.46 2A16 16 0 1 1 24 8Z" />
    </svg>
  )
}

function ShopIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path d="M15 12h18l2 7h4.5a2 2 0 0 1 1.98 2.3l-2.8 18A4 4 0 0 1 34.73 43H13.27a4 4 0 0 1-3.95-3.7l-2.8-18A2 2 0 0 1 8.5 19H13l2-7Zm3.08 0L16.65 19h14.7L29.92 12H18.08ZM11 23l2.27 15h21.46L37 23H11Z" />
      <path d="M19 10a5 5 0 0 1 10 0v2h-4v-2a1 1 0 0 0-2 0v2h-4v-2Z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path d="M25 15a1 1 0 0 1 1 1v6h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-6v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-6h-6a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h6v-6a1 1 0 0 1 1-1h2Z" />
    </svg>
  )
}

function InboxIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path d="M8 10h32a2 2 0 0 1 2 2v23a2 2 0 0 1-2 2H18.8l-7.42 5.57A1.5 1.5 0 0 1 9 41.37V37H8a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2Zm2 4v19h3v3.37L17.47 33H38V14H10Z" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path d="M24 3a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 4a6 6 0 1 0 0 12A6 6 0 0 0 24 7Zm0 19c10.3 0 16.67 6.99 17 17 .02.55-.43 1-1 1h-2c-.54 0-.98-.45-1-1-.3-7.84-4.9-13-13-13s-12.7 5.16-13 13c-.02.55-.46 1-1.02 1h-2c-.55 0-1-.45-.98-1C7.33 32.99 13.7 26 24 26Z" />
    </svg>
  )
}

function MobileBottomNav() {
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();
  const [isRefreshingHome, setIsRefreshingHome] = useState(false);
  const profilePath = user?.username ? `/@${encodeURIComponent(user.username)}` : "/";
  const isHome = location.pathname === "/";
  const isMessages = location.pathname.startsWith("/messages");
  const isProfile = location.pathname.startsWith("/@");
  const refreshHomeFeed = () => {
    setIsRefreshingHome(true);
    if (isHome) {
      window.dispatchEvent(new CustomEvent("tt-home-refresh"));
    }
  };

  useEffect(() => {
    if (!isRefreshingHome) return undefined;

    const finishRefresh = () => setIsRefreshingHome(false);
    const fallbackTimer = window.setTimeout(finishRefresh, 1400);
    window.addEventListener("tt-home-refresh-complete", finishRefresh);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("tt-home-refresh-complete", finishRefresh);
    };
  }, [isRefreshingHome]);

  return (
    <nav className="mobile-bottom-nav" aria-label="Điều hướng chính">
      <Link
        className={`mobile-bottom-nav__item${isHome ? " mobile-bottom-nav__item--active" : ""}${isRefreshingHome ? " mobile-bottom-nav__item--refreshing" : ""}`}
        to="/"
        onClick={refreshHomeFeed}
      >
        {isRefreshingHome ? <RefreshIcon /> : <HomeIcon />}
        <span>Home</span>
      </Link>
      <button type="button" className="mobile-bottom-nav__item" aria-label="Shop">
        <ShopIcon />
        <span>Shop</span>
      </button>
      {isLoggedIn ? (
        <Link className="mobile-bottom-nav__create" to="/upload" aria-label="Tải video lên">
          <PlusIcon />
        </Link>
      ) : (
        <button type="button" className="mobile-bottom-nav__create" aria-label="Tải video lên" onClick={openLoginModal}>
          <PlusIcon />
        </button>
      )}
      <Link className={`mobile-bottom-nav__item${isMessages ? " mobile-bottom-nav__item--active" : ""}`} to="/messages">
        <InboxIcon />
        <span>Inbox</span>
      </Link>
      {isLoggedIn ? (
        <Link className={`mobile-bottom-nav__item${isProfile ? " mobile-bottom-nav__item--active" : ""}`} to={profilePath}>
          <ProfileIcon />
          <span>Profile</span>
        </Link>
      ) : (
        <button type="button" className="mobile-bottom-nav__item" onClick={openLoginModal}>
          <ProfileIcon />
          <span>Profile</span>
        </button>
      )}
    </nav>
  )
}

export default function MainLayout() {
  const location = useLocation();
  const isSidebarCollapsed = location.pathname.startsWith("/messages");

  useEffect(() => {
    bootstrapAuthSession();
  }, []);

  return (
    <>
      <div className="d-flex app-layout">
        <Sidebar />
        <main className={`content${isSidebarCollapsed ? " content--sidebar-collapsed" : ""}`}>
          <div className="content-inner">
            <Outlet />
          </div>
        </main>
        <TopRightActionBar />
        <MobileBottomNav />
      </div>
    </>
  )
}
