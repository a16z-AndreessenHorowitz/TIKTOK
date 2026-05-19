import { useCallback, useEffect, useRef, useState } from "react";
import UploadPreviewPhone from "../components/UploadPreviewPhone";
import { uploadVideo } from "../lib/videoUpload";
import "./css/UploadPage.css";

const MAX_BYTES = 30 * 1024 * 1024 * 1024;
const ACCEPTED_EXT = [".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"];

const SPECS = [
  {
    icon: "size",
    title: "Kích thước và thời lượng",
    desc: "Dung lượng tối đa 30 GB, video dài tối đa 60 phút.",
  },
  {
    icon: "format",
    title: "Định dạng tệp",
    desc: "Định dạng đề xuất: .mp4. Các định dạng chính khác được hỗ trợ.",
  },
  {
    icon: "resolution",
    title: "Độ phân giải video",
    desc: "Độ phân giải đề xuất: 1080p, 1440p, 4K. 60 fps được hỗ trợ.",
  },
  {
    icon: "ratio",
    title: "Tỷ lệ khung hình",
    desc: "Đề xuất: 16:9 dọc và 9:16 ngang.",
  },
];

function SpecIcon({ type }) {
  const common = { width: 24, height: 24, viewBox: "0 0 48 48", fill: "currentColor", "aria-hidden": true };
  switch (type) {
    case "size":
      return (
        <svg {...common}>
          <path d="M10 8h28a2 2 0 0 1 2 2v28a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Zm2 4v24h24V12H12Z" />
        </svg>
      );
    case "format":
      return (
        <svg {...common}>
          <path d="M14 6h14l12 12v24a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm2 6v26h16V20H24V12h-8Z" />
        </svg>
      );
    case "resolution":
      return (
        <svg {...common}>
          <path d="M6 14h36v20H6V14Zm4 4v12h28V18H10Z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M8 12h32v24H8V12Zm4 4v16h24V16H12Z" />
        </svg>
      );
  }
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function validateVideoFile(file) {
  if (!file) return "Không có tệp được chọn.";
  if (!file.type.startsWith("video/")) {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) {
      return "Vui lòng chọn tệp video (.mp4, .mov, .webm, …).";
    }
  }
  if (file.size > MAX_BYTES) {
    return "Video vượt quá dung lượng tối đa 30 GB.";
  }
  return null;
}

export default function UploadPage() {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState("");

  const openFilePicker = () => inputRef.current?.click();

  const processFile = useCallback((file) => {
    const validationError = validateVideoFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setProgress(0);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription("");
    setError("");
    setProgress(0);
  };

  const publishVideo = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");
    setProgress(15);

    try {
      setProgress(65);
      const video = await uploadVideo({ file: selectedFile, caption: description });
      setProgress(100);
      window.alert(`Đã tải lên: ${video?.videoUrl || selectedFile.name}`);
      clearPreview();
    } catch (err) {
      setError(err.message || "Tải video lên thất bại.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="upload-page">
      {previewUrl ? (
        <div className="upload-page__body upload-page__grid">
          <div className="upload-meta-panel">
            <div className="upload-card">
              <h2 className="upload-card__title">Thông tin video</h2>
              <div className="upload-card__section">
                <label className="upload-card__label" htmlFor="video-description">
                  Mô tả
                </label>
                <textarea
                  id="video-description"
                  className="upload-card__textarea"
                  placeholder="Nhập nội dung, hashtag, tên bài hát..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="upload-card__section">
                <label className="upload-card__label">Ảnh bìa</label>
                <div className="upload-card__cover">
                  <div className="upload-card__cover-preview">Chưa có ảnh</div>
                  <button type="button" className="upload-card__cover-btn">
                    Chọn ảnh bìa
                  </button>
                </div>
              </div>
              <div className="upload-card__section">
                <label className="upload-card__label" htmlFor="video-location">
                  Vị trí
                </label>
                <input
                  id="video-location"
                  className="upload-card__input"
                  type="text"
                  placeholder="Nhập vị trí hoặc địa điểm"
                />
              </div>
            </div>
          </div>

          <div className="upload-preview-side">
            <UploadPreviewPhone previewUrl={previewUrl} description={description} />

            <div className="upload-preview-actions">
              <button
                type="button"
                className="upload-dropzone__btn"
                onClick={publishVideo}
                disabled={uploading}
              >
                Đăng lên
              </button>
              <button
                type="button"
                className="upload-preview__clear-btn"
                onClick={clearPreview}
                disabled={uploading}
              >
                Chọn lại video
              </button>
            </div>
            {uploading ? (
              <div className="upload-dropzone__progress upload-preview-progress">
                <div className="upload-dropzone__progress-bar" style={{ width: `${progress}%` }} />
                <span>Đang tải lên… {progress}%</span>
              </div>
            ) : null}
            {error ? (
              <p className="upload-dropzone__error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="upload-page__body">
          <div
            className={`upload-dropzone${isDragging ? " upload-dropzone--drag" : ""}${uploading ? " upload-dropzone--busy" : ""}`}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
              e.preventDefault();
              if (e.currentTarget === e.target) setIsDragging(false);
            }}
            onDrop={onDrop}
          >
            <div className="upload-dropzone__icon" aria-hidden>
              <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
                <rect x="12" y="18" width="56" height="40" rx="6" stroke="#b8c5d6" strokeWidth="2" fill="#f5f8fc" />
                <path d="M32 34l8 8 8-8M40 42V28" stroke="#7b8fa8" strokeWidth="2" strokeLinecap="round" />
                <rect x="28" y="14" width="24" height="8" rx="2" fill="#dfe8f3" />
              </svg>
            </div>

            <h1 className="upload-dropzone__title">Chọn video để tải lên</h1>
            <p className="upload-dropzone__subtitle">Hoặc kéo và thả vào đây</p>

            {selectedFile && !uploading ? (
              <p className="upload-dropzone__file">
                {selectedFile.name} · {formatBytes(selectedFile.size)}
              </p>
            ) : null}

            {uploading ? (
              <div className="upload-dropzone__progress">
                <div className="upload-dropzone__progress-bar" style={{ width: `${progress}%` }} />
                <span>Đang tải lên… {progress}%</span>
              </div>
            ) : (
              <button
                type="button"
                className="upload-dropzone__btn"
                onClick={openFilePicker}
                disabled={uploading}
              >
                Chọn video
              </button>
            )}

            {error ? (
              <p className="upload-dropzone__error" role="alert">
                {error}
              </p>
            ) : null}

            <input
              ref={inputRef}
              type="file"
              accept="video/*,.mp4,.mov,.webm,.mkv,.avi,.m4v"
              className="upload-dropzone__input"
              onChange={onFileChange}
            />
          </div>

          <ul className="upload-specs">
            {SPECS.map((spec) => (
              <li key={spec.title} className="upload-specs__item">
                <span className="upload-specs__icon">
                  <SpecIcon type={spec.icon} />
                </span>
                <div>
                  <p className="upload-specs__title">{spec.title}</p>
                  <p className="upload-specs__desc">{spec.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="upload-capcut-banner">
        <div className="upload-capcut-banner__content">
          <span className="upload-capcut-banner__logo">CapCut</span>
          <span>CapCut Online: chỉnh sửa video trực tuyến miễn phí</span>
        </div>
        <button type="button" className="upload-capcut-banner__cta">
          Dùng thử ngay
        </button>
      </div>
    </div>
  );
}
