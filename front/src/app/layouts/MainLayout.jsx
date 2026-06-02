import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { bootstrapAuthSession } from "../../api/authApi";
import Sidebar from "../../widgets/sidebar/Sidebar";
import TopRightActionBar from "../../widgets/top-right-action-bar/TopRightActionBar";
import "./MainLayout.css"

export default function MainLayout() {
  const location = useLocation();
  const isSidebarCollapsed = location.pathname.startsWith("/messages");

  useEffect(() => {
    bootstrapAuthSession();
  }, []);

  return <>
     <div className="d-flex app-layout">
        <Sidebar />
        <main className={`content${isSidebarCollapsed ? " content--sidebar-collapsed" : ""}`}>
          <div className="content-inner">
            <Outlet />
          </div>
        </main>
        <TopRightActionBar />
      </div>
  </>
}
