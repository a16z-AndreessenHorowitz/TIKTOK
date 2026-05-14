
import { useEffect, useState, useRef } from "react";
import "../assets/styles/home.css";

/** Khóa list React — id có thể trùng/null */
function clipListKey(video, index) {
  return `${video?.id ?? "na"}:${index}`;
}

export default function Home() {
  const [videos, setVideos] = useState([]);
  /** Một lần bật/tắt tiếng & mức volume cho cả feed (giống TikTok) */
  const [feedAudio, setFeedAudio] = useState({
    volume: 0.8,
    muted: true,
    lastVolume: 0.8,
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef(null);
  const videoRefs = useRef([]);
  const feedAudioRef = useRef(feedAudio);

  useEffect(() => {
    feedAudioRef.current = feedAudio;
  }, [feedAudio]);

  // =========================
  // FETCH DATA
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/v1/videos/feed");
        const data = await res.json();
        setVideos(data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // =========================
  // 🎬 AUTO PLAY (TIKTOK STYLE)
  // =========================
  useEffect(() => {
    if (!videos.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;

          if (entry.isIntersecting) {
            const index = videoRefs.current.findIndex(
              (v) => v === video
            );

            setActiveIndex(index);

            const a = feedAudioRef.current;

            video.volume = a.volume;
            video.muted = a.muted;

            video.play().catch(() => {});
          } else {
            video.pause();
            video.currentTime = 0;
          }
        });
      },
      {
        threshold: 0.7, // giống TikTok
      }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, [videos]);

  useEffect(() => {
    const el = videoRefs.current[activeIndex];
    if (!el) return;
    el.volume = feedAudio.volume;
    el.muted = feedAudio.muted;
  }, [feedAudio, activeIndex, videos]);

  const toggleSound = () => {
    setFeedAudio((prev) => {
      if (prev.muted) {
        const vol = prev.lastVolume > 0 ? prev.lastVolume : 0.8;
        return { ...prev, muted: false, volume: vol };
      }
      return {
        ...prev,
        muted: true,
        lastVolume: prev.volume > 0 ? prev.volume : prev.lastVolume,
      };
    });
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setFeedAudio((prev) => ({
      ...prev,
      volume: v,
      muted: v === 0,
      lastVolume: v > 0 ? v : prev.lastVolume,
    }));
  };

  // =========================
  // EMPTY
  // =========================
  if (videos.length === 0) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#fff",
          background: "white",
          fontSize: "20px",
        }}
      >
        Không có video
      </div>
    );
  }

  // =========================
  // VIDEO FEED
  // =========================
  return (
    <div
      ref={containerRef}
      className="feed-container"
    >
      {videos.map((video, index) => {
        const rowKey = clipListKey(video, index);
        return (
        <div
          key={rowKey}
          className="feed-item"
        >

          <div
          className="video-frame"
          >
          
          <div className="video-wrapper">
            <div className="video-inner video">
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={video.videoUrl}
                loop
                playsInline
                className="video-player"
              />

              {/* Overlay âm lượng trong khung video (góc trên trái, giống TikTok) */}
              <div className="volume-box">
                <button
                  type="button"
                  className="volume-box__btn"
                  onClick={toggleSound}
                  aria-label={feedAudio.muted ? "Bật tiếng" : "Tắt tiếng"}
                >
                  {feedAudio.muted ? (
                    <i className="fa-solid fa-volume-xmark" aria-hidden />
                  ) : (
                    <i className="fa-solid fa-volume-high" aria-hidden />
                  )}
                </button>

                <input
                  className="volume-range"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={feedAudio.volume}
                  onChange={handleVolumeChange}
                  aria-label="Âm lượng"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
        );
      })}
    </div>
  );
}