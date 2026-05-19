import { Route } from "react-router-dom";
import Home from "../pages/home";
import UploadPage from "../pages/UploadPage";
import StudioPlaceholder from "../pages/StudioPlaceholder";
import MainLayout from "../layouts/MainLayout";
import StudioLayout from "../layouts/StudioLayout";
import RequireAuth from "../components/RequireAuth";

const clientRoutes = (
  <>
    <Route element={<MainLayout />}>
      <Route path="/" element={<Home />} />
    </Route>

    <Route element={<RequireAuth />}>
      <Route element={<StudioLayout />}>
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/upload/posts" element={<StudioPlaceholder title="Bài đăng" />} />
        <Route path="/upload/analytics" element={<StudioPlaceholder title="Thống kê" />} />
        <Route path="/upload/comments" element={<StudioPlaceholder title="Bình luận" />} />
        <Route path="/upload/inspiration" element={<StudioPlaceholder title="Nguồn cảm hứng" />} />
        <Route path="/upload/monetize" element={<StudioPlaceholder title="Kiếm tiền" />} />
        <Route path="/upload/academy" element={<StudioPlaceholder title="Học viện Người sáng tạo" />} />
        <Route path="/upload/sounds" element={<StudioPlaceholder title="Âm thanh không giới hạn" />} />
        <Route path="/upload/feedback" element={<StudioPlaceholder title="Phản hồi" />} />
      </Route>
    </Route>
  </>
);

export default clientRoutes;
