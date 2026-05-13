import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopRightActionBar from "../components/TopRightActionBar";
import "./css/MainLayout.css"

export default function MainLayout() {
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