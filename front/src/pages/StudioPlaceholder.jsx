import { Link } from "react-router-dom";

export default function StudioPlaceholder({ title }) {
  return (
    <div className="studio-placeholder">
      <h1>{title}</h1>
      <p>Trang này đang được phát triển.</p>
      <Link to="/upload">Quay lại Tải lên</Link>
    </div>
  );
}
