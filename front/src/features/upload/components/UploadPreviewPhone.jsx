import { useEffect, useRef, useState } from "react";
import "../../../styles/UploadPreviewPhone.css";

export default function UploadPreviewPhone({ previewUrl, description = "" }) {
  const videoRef = useRef(null);
  const [videoLayout, setVideoLayout] = useState({ previewUrl: null, fit: "cover" });
  const [isPlaying, setIsPlaying] = useState(false);
  const videoFit = videoLayout.previewUrl === previewUrl ? videoLayout.fit : "cover";
  const caption = description.trim() || "";

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !previewUrl) return undefined;

    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;
    video.play().catch(() => {});

    return () => {
      video.pause();
    };
  }, [previewUrl]);

  if (!previewUrl) return null;

  const updateVideoFit = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) return;

    setVideoLayout({
      previewUrl,
      fit: video.videoWidth > video.videoHeight ? "contain" : "cover",
    });
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.muted = false;
      video.volume = 1;
      video.play().catch(() => {});
      return;
    }

    if (video.muted) {
      video.muted = false;
      video.volume = 1;
      return;
    }

    video.pause();
  };

  return (
    <div className="upload-preview-phone">
      <div className="upload-preview-phone__top">
        <div className="upload-preview-phone__status">
          <span>8:00</span>
          <div className="upload-preview-phone__status-icons" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M3 16h3v4H3v-4Zm5-4h3v8H8v-8Zm5-4h3v12h-3V8Zm5-4h3v16h-3V4Z" />
            </svg>
            <svg viewBox="0 0 24 24">
              <path d="M12 18.5 16 14a5.8 5.8 0 0 0-8 0l4 4.5Zm-7.2-8.2 1.8 1.8a7.7 7.7 0 0 1 10.8 0l1.8-1.8a10.2 10.2 0 0 0-14.4 0Zm-3.3-3.4 1.8 1.8a12.4 12.4 0 0 1 17.4 0l1.8-1.8a14.9 14.9 0 0 0-21 0Z" />
            </svg>
            <span className="upload-preview-phone__battery" />
          </div>
        </div>

        <div className="upload-preview-phone__nav">
          <span className="upload-preview-phone__live">LIVE</span>
          <div className="upload-preview-phone__feed-tabs">
            <span>Following</span>
            <strong>For You</strong>
          </div>
          <svg className="upload-preview-phone__search" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.5 3a7.5 7.5 0 0 1 5.93 12.1l4.24 4.23-1.34 1.34-4.23-4.24A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" />
          </svg>
        </div>
      </div>

      <div className="upload-preview-phone__video-frame" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={previewUrl}
          autoPlay
          loop
          playsInline
          preload="auto"
          onLoadedMetadata={updateVideoFit}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className={`upload-preview-phone__video upload-preview-phone__video--${videoFit}`}
        />
        {!isPlaying ? (
          <span className="upload-preview-phone__play" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M8 5v14l11-7L8 5Z" />
            </svg>
          </span>
        ) : null}
      </div>

      <div className="upload-preview-phone__footer">
        <div className="upload-preview-phone__details">
          <div className="upload-preview-phone__copy">
            <p className="upload-preview-phone__author">Minh Huy</p>
            <p className="upload-preview-phone__caption">{caption}</p>
          </div>

          <p className="upload-preview-phone__sound">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4h8v4h-6v8a4 4 0 1 1-2-3.46V4Z" />
            </svg>
            <span>Âm thanh gốc - Minh Huy</span>
            <span className="upload-preview-phone__record" aria-hidden="true" />
          </p>
        </div>

        <div className="upload-preview-phone__tabs" aria-label="Thanh điều hướng preview">
          <span className="upload-preview-phone__tab upload-preview-phone__tab--active">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 10.7 12 3l9 7.7V21h-6v-6H9v6H3V10.7Z" />
            </svg>
            <span>Home</span>
          </span>
          <span className="upload-preview-phone__tab">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm8.5 1a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7ZM2 21a6 6 0 0 1 12 0H2Zm11.5 0a7.4 7.4 0 0 0-1.4-4.4A5.5 5.5 0 0 1 22 21h-8.5Z" />
            </svg>
            <span>Friends</span>
          </span>
          <span className="upload-preview-phone__create" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" />
            </svg>
          </span>
          <span className="upload-preview-phone__tab">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 4h16v12H8l-4 4V4Zm4 5v2h8V9H8Z" />
            </svg>
            <span>Inbox</span>
          </span>
          <span className="upload-preview-phone__tab">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-8 9a8 8 0 0 1 16 0H4Z" />
            </svg>
            <span>Me</span>
          </span>
        </div>
      </div>
    </div>
  );
}
