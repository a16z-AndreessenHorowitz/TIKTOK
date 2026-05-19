import { Outlet } from "react-router-dom";
import StudioSidebar from "../components/studio/StudioSidebar";
import "./css/StudioLayout.css";

export default function StudioLayout() {
  return (
    <div className="studio-layout">
      <StudioSidebar />
      <main className="studio-main">
        <Outlet />
      </main>
    </div>
  );
}
