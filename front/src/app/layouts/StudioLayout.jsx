import { Outlet } from "react-router-dom";
import StudioSidebar from "../../widgets/studio-sidebar/StudioSidebar";
import "./StudioLayout.css";

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
