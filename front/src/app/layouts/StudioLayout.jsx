import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import StudioSidebar from "../../widgets/studio-sidebar/StudioSidebar";
import "../../styles/StudioLayout.css";

export default function StudioLayout() {
  const location = useLocation();
  const [openLocationKey, setOpenLocationKey] = useState(null);
  const isMobileSidebarOpen = openLocationKey === location.key;
  const closeMobileSidebar = () => setOpenLocationKey(null);

  useEffect(() => {
    if (!isMobileSidebarOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        closeMobileSidebar();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMobileSidebarOpen]);

  return (
    <div className={`studio-layout${isMobileSidebarOpen ? " studio-layout--sidebar-open" : ""}`}>
      <button
        type="button"
        className="studio-mobile-menu"
        aria-label={isMobileSidebarOpen ? "Ẩn menu Studio" : "Mở menu Studio"}
        aria-controls="studio-sidebar"
        aria-expanded={isMobileSidebarOpen}
        onClick={() => {
          setOpenLocationKey((currentKey) => (currentKey === location.key ? null : location.key));
        }}
      >
        <span className="studio-mobile-menu__bar" aria-hidden />
        <span className="studio-mobile-menu__bar" aria-hidden />
        <span className="studio-mobile-menu__bar" aria-hidden />
      </button>
      <button
        type="button"
        className="studio-sidebar-backdrop"
        aria-label="Ẩn menu Studio"
        onClick={closeMobileSidebar}
      />
      <StudioSidebar onNavigate={closeMobileSidebar} />
      <main className="studio-main">
        <Outlet />
      </main>
    </div>
  );
}
