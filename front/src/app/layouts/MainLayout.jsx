import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { bootstrapAuthSession } from "../../api/authApi";
import Sidebar from "../../widgets/sidebar/Sidebar";
import TopRightActionBar from "../../widgets/top-right-action-bar/TopRightActionBar";
import "./MainLayout.css"

export default function MainLayout() {
  useEffect(() => {
    bootstrapAuthSession();
  }, []);

  return <>
     <div className="d-flex app-layout">
        <Sidebar />
        <main className="content">
          <div className="content-inner">
            <Outlet />
          </div>
        </main>
        <TopRightActionBar />
      </div>
  </>
}
