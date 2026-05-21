import { useCallback, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import VideoActionBox from "../components/VideoActionBox";
import "../assets/styles/home.css";

const FEED_AUDIO_KEY = "tt_feed_audio";
const FEED_PAGE_LIMIT = 8;
const FEED_PREFETCH_DISTANCE = 3;
const DEFAULT_FEED_AUDIO = {
  volume: 0.8,
  muted: true,
  lastVolume: 0.8,
};

/** Khóa list React — id có thể trùng/null */
function clipListKey(video, index) {
  return `${video?.id ?? "na"}:${index}`;
}

function getVideoUrl(video) {
  const url = video?.video?.playUrl ?? video?.videoUrl;
  return typeof url === "string" ? url.trim() : "";
}

function getThumbnailUrl(video) {
  const url = video?.video?.thumbnailUrl ?? video?.thumbnailUrl;
  return typeof url === "string" ? url.trim() : "";
}

function readFeedPage(data) {
  if (Array.isArray(data)) {
    return { items: data, nextCursor: null };
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    nextCursor: typeof data?.nextCursor === "string" && data.nextCursor ? data.nextCursor : null,
  };
}
//feed video API trả về rất nhiều trường khác nhau tùy video, nên tạm viết thủ công thế này để dễ xử lý sau này, tránh lỗi kiểu dữ liệu, đồng thời chuẩn hóa một số thứ như URL playback, thumbnail, username, avatar, stats... Cũng là để tránh việc phải xử lý nhiều trường hợp null/undefined ở component chính bên dưới cho đỡ rối. Còn nếu API đã ổn định và thống nhất thì có thể bỏ qua bước này và đọc trực tiếp từ API luôn cũng được.
async function fetchFeedPage(cursor) {
  const params = new URLSearchParams({ limit: String(FEED_PAGE_LIMIT) });
  if (cursor) {
    params.set("cursor", cursor);
  }

  const res = await fetch(`/api/v1/videos/feed?${params}`);
  const payload = await res.json();
  console.log("feed response", payload);
  return readFeedPage(payload.data);
}

function createdAtTime(video) {
  const time = Date.parse(video?.createdAt || "");
  return Number.isFinite(time) ? time : 0;
}

function normalizeVideo(video, index) {
  const originalVideoUrl = getVideoUrl(video);
  if (!originalVideoUrl) return null;

  const author = video.author || {};
  const music = video.music || {};
  const stats = video.stats || {};

  return {
    ...video,
    caption: video.caption || "",
    createdAt: video.createdAt,
    videoUrl: originalVideoUrl,
    thumbnailUrl: getThumbnailUrl(video),
    duration: video?.video?.duration ?? video.duration ?? null,
    username: video.username ?? author.username ?? author.name ?? null,
    avatarUrl: video.avatarUrl ?? author.avatar ?? null,
    musicTitle: video.musicTitle ?? music.title ?? "Âm thanh gốc",
    likeCount: video.likeCount ?? stats.likes ?? 0,
    commentCount: video.commentCount ?? stats.comments ?? 0,
    viewCount: video.viewCount ?? stats.views ?? 0,
    shareCount: video.shareCount ?? stats.shares ?? 0,
    originalVideoUrl,
    playbackUrl: originalVideoUrl,
    sortIndex: index,
  };
}

function prepareFeed(feed, pinnedVideoId, pinnedVideo) {
  const feedItems = Array.isArray(feed) ? feed : [];
  const pinnedId = pinnedVideoId == null ? null : String(pinnedVideoId);
  const normalized = [
    normalizeVideo(pinnedVideo, -1),
    ...feedItems.map((video, index) => normalizeVideo(video, index)),
  ].filter(Boolean);

  const seen = new Set();
  return normalized
    .filter((video) => {
      const key = video.id ?? video.originalVideoUrl;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      if (pinnedId && String(a.id) === pinnedId) return -1;
      if (pinnedId && String(b.id) === pinnedId) return 1;

      const createdDiff = createdAtTime(b) - createdAtTime(a);
      if (createdDiff !== 0) return createdDiff;

      const idDiff = Number(b.id || 0) - Number(a.id || 0);
      if (idDiff !== 0) return idDiff;

      return a.sortIndex - b.sortIndex;
    });
}

function readFeedAudio() {
  try {
    const raw = sessionStorage.getItem(FEED_AUDIO_KEY);
    if (!raw) return DEFAULT_FEED_AUDIO;

    const parsed = JSON.parse(raw);
    const volume = Number(parsed.volume);
    const lastVolume = Number(parsed.lastVolume);

    return {
      volume: Number.isFinite(volume) ? Math.min(Math.max(volume, 0), 1) : DEFAULT_FEED_AUDIO.volume,
      muted: Boolean(parsed.muted),
      lastVolume: Number.isFinite(lastVolume)
        ? Math.min(Math.max(lastVolume, 0), 1)
        : DEFAULT_FEED_AUDIO.lastVolume,
    };
  } catch {
    return DEFAULT_FEED_AUDIO;
  }
}

function saveFeedAudio(feedAudio) {
  sessionStorage.setItem(FEED_AUDIO_KEY, JSON.stringify(feedAudio));
}

function VideoCaption({ caption, expanded, onExpand, onCollapse }) {
  const textRef = useRef(null);
  const measureRef = useRef(null);
  const [canToggle, setCanToggle] = useState(false);

  const measureOverflow = useCallback(() => {
    const textEl = textRef.current;
    const measureEl = measureRef.current;
    const containerEl = textEl?.parentElement;
    if (!textEl || !measureEl || !containerEl) return;

    const availableWidth = containerEl.clientWidth;
    setCanToggle(measureEl.scrollWidth > availableWidth + 1);
  }, []);

  useEffect(() => {
    measureOverflow();
    const frame = requestAnimationFrame(measureOverflow);
    const containerEl = textRef.current?.parentElement;

    let observer;
    if (containerEl && "ResizeObserver" in window) {
      observer = new ResizeObserver(measureOverflow);
      observer.observe(containerEl);
    }

    window.addEventListener("resize", measureOverflow);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measureOverflow);
    };
  }, [caption, measureOverflow]);

  const showToggle = canToggle || expanded;

  return (
    <div className={`video-meta__caption${expanded ? " video-meta__caption--expanded" : ""}`}>
      <p ref={textRef} className="video-meta__caption-text">{caption}</p>
      <span ref={measureRef} className="video-meta__caption-measure" aria-hidden="true">
        {caption}
      </span>
      {showToggle ? (
        <button
          type="button"
          className="video-meta__more"
          onClick={expanded ? onCollapse : onExpand}
        >
          {expanded ? "ẩn bớt" : "thêm"}
        </button>
      ) : null}
    </div>
  );
}

export default function Home() {
  const location = useLocation();
  const pinnedVideoId = location.state?.uploadedVideoId;
  const pinnedVideo = location.state?.uploadedVideo;
  const [videos, setVideos] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [failedVideos, setFailedVideos] = useState(() => new Set());
  const [expandedCaptions, setExpandedCaptions] = useState(() => new Set());
  const [videoRatios, setVideoRatios] = useState({});
  /** Một lần bật/tắt tiếng & mức volume cho cả feed (giống TikTok) */
  const [feedAudio, setFeedAudio] = useState(readFeedAudio);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef(null);
  const videoRefs = useRef([]);
  const feedAudioRef = useRef(feedAudio);
  const activeIndexRef = useRef(activeIndex);
  const nextCursorRef = useRef(null);
  const loadingFeedRef = useRef(false);

  useEffect(() => {
    feedAudioRef.current = feedAudio;
    saveFeedAudio(feedAudio);
  }, [feedAudio]);

  const pauseInactiveVideos = useCallback((activeVideoIndex) => {
    videoRefs.current.forEach((video, index) => {
      if (!video || index === activeVideoIndex) return;
      video.muted = true;
      video.pause();
      video.currentTime = 0;
    });
  }, []);

  const applyAudioToVideo = useCallback((video, index, audio = feedAudioRef.current) => {
    if (!video) return;
    const isActiveVideo = index === activeIndexRef.current;
    video.volume = isActiveVideo ? audio.volume : 0;
    video.muted = !isActiveVideo || audio.muted;
  }, []);

  const playVideo = useCallback((video, index = activeIndexRef.current) => {
    if (!video) return;
    if (index !== activeIndexRef.current) {
      video.muted = true;
      video.pause();
      return;
    }

    pauseInactiveVideos(index);
    applyAudioToVideo(video, index);
    const playPromise = video.play();
    if (!playPromise?.catch) return;

    playPromise.catch((err) => {
      if (err?.name !== "NotAllowedError") return;

      const mutedAudio = { ...feedAudioRef.current, muted: true };
      feedAudioRef.current = mutedAudio;
      setFeedAudio(mutedAudio);
      applyAudioToVideo(video, index, mutedAudio);
      video.play().catch(() => {});
    });
  }, [applyAudioToVideo, pauseInactiveVideos]);

  const playActiveVideo = useCallback((index = activeIndexRef.current) => {
    const video = videoRefs.current[index];
    if (video) {
      activeIndexRef.current = index;
      playVideo(video, index);
    }
  }, [playVideo]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    pauseInactiveVideos(activeIndex);
  }, [activeIndex, pauseInactiveVideos]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    containerRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // =========================
  // FETCH DATA
  // =========================
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (loadingFeedRef.current) return;
      loadingFeedRef.current = true;

      try {
        const page = await fetchFeedPage(null);
        if (cancelled) return;

        nextCursorRef.current = page.nextCursor;
        videoRefs.current = [];
        activeIndexRef.current = 0;
        setNextCursor(page.nextCursor);
        setActiveIndex(0);
        setFailedVideos(new Set());
        setExpandedCaptions(new Set());
        setVideoRatios({});
        setVideos(prepareFeed(page.items, pinnedVideoId, pinnedVideo));
      } catch (err) {
        console.error(err);
      } finally {
        loadingFeedRef.current = false;
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [pinnedVideo, pinnedVideoId]);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [videos.length]);

  useEffect(() => {
    if (!nextCursor) return;
    if (activeIndex < videos.length - FEED_PREFETCH_DISTANCE) return;

    let cancelled = false;

    const prefetchNextPage = async () => {
      if (loadingFeedRef.current) return;
      loadingFeedRef.current = true;

      try {
        const page = await fetchFeedPage(nextCursor);
        if (cancelled) return;

        nextCursorRef.current = page.nextCursor;
        setNextCursor(page.nextCursor);
        setVideos((prev) => prepareFeed([...prev, ...page.items], pinnedVideoId, pinnedVideo));
      } catch (err) {
        console.error(err);
      } finally {
        loadingFeedRef.current = false;
      }
    };

    prefetchNextPage();

    return () => {
      cancelled = true;
    };
  }, [activeIndex, nextCursor, pinnedVideo, pinnedVideoId, videos.length]);

  // =========================
  // 🎬 AUTO PLAY (TIKTOK STYLE)
  // =========================
  useEffect(() => {
    if (!videos.length) return;
    const scrollRoot = containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            const index = videoRefs.current.findIndex(
              (v) => v === video
            );
            if (index < 0) return;

            activeIndexRef.current = index;
            pauseInactiveVideos(index);
            setActiveIndex(index);

            playVideo(video, index);
          } else {
            video.muted = true;
            video.pause();
            video.currentTime = 0;
          }
        });
      },
      {
        root: scrollRoot,
        threshold: 0.55, // giống TikTok, nhưng dễ kích hoạt hơn khi mới vào trang
      }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, [pauseInactiveVideos, playVideo, videos]);

  useEffect(() => {
    if (!videos.length) return;

    const raf = requestAnimationFrame(() => {
      playActiveVideo(activeIndexRef.current);
    });

    return () => cancelAnimationFrame(raf);
  }, [playActiveVideo, videos.length]);

  useEffect(() => {
    const el = videoRefs.current[activeIndex];
    if (!el) return;
    activeIndexRef.current = activeIndex;
    applyAudioToVideo(el, activeIndex, feedAudio);
    playVideo(el, activeIndex);
  }, [applyAudioToVideo, feedAudio, activeIndex, playVideo, videos]);

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

  const markVideoReady = (rowKey) => {
    setFailedVideos((prev) => {
      if (!prev.has(rowKey)) return prev;
      const next = new Set(prev);
      next.delete(rowKey);
      return next;
    });
  };

  const updateVideoRatio = (rowKey, video) => {
    if (!video?.videoWidth || !video?.videoHeight) return;

    const ratio = video.videoWidth / video.videoHeight;
    setVideoRatios((prev) => {
      if (Math.abs((prev[rowKey] || 0) - ratio) < 0.001) return prev;
      return { ...prev, [rowKey]: ratio };
    });
  };

  const markVideoFailed = (rowKey) => {
    setFailedVideos((prev) => {
      if (prev.has(rowKey)) return prev;
      const next = new Set(prev);
      next.add(rowKey);
      return next;
    });
  };

  const handleVideoError = (rowKey) => {
    markVideoFailed(rowKey);
  };

  const expandCaption = (rowKey) => {
    setExpandedCaptions((prev) => {
      if (prev.has(rowKey)) return prev;
      const next = new Set(prev);
      next.add(rowKey);
      return next;
    });
  };

  const collapseCaption = (rowKey) => {
    setExpandedCaptions((prev) => {
      if (!prev.has(rowKey)) return prev;
      const next = new Set(prev);
      next.delete(rowKey);
      return next;
    });
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
        const hasVideoError = failedVideos.has(rowKey);
        const isCaptionExpanded = expandedCaptions.has(rowKey);
        const videoRatio = videoRatios[rowKey] || 9 / 16;
        const actionBoxPlacement = videoRatio >= 1 ? "center" : "bottom";
        return (
          <div key={rowKey} className="feed-item">
            <div className="feed-stage">
              <div
                className="video-frame"
                style={{ "--video-aspect-ratio": String(videoRatio) }}
              >
                <div className="video-wrapper">
                  <div className="video-inner video">
                    <video
                      ref={(el) => (videoRefs.current[index] = el)}
                      src={video.videoUrl}
                      loop
                      playsInline
                      muted={index !== activeIndex || feedAudio.muted}
                      preload={index === activeIndex ? "auto" : "metadata"}
                      onLoadedMetadata={(e) => {
                        updateVideoRatio(rowKey, e.currentTarget);
                        if (index === activeIndexRef.current) {
                          playVideo(e.currentTarget, index);
                        }
                      }}
                      onCanPlay={(e) => {
                        updateVideoRatio(rowKey, e.currentTarget);
                        markVideoReady(rowKey);
                        if (index === activeIndexRef.current) {
                          playVideo(e.currentTarget, index);
                        } else {
                          e.currentTarget.muted = true;
                        }
                      }}
                      onError={() => handleVideoError(rowKey)}
                      className="video-player"
                    />

                    <div className="video-meta">
                      <p className="video-meta__author">{video.username || "Người dùng TikTok"}</p>
                      {video.caption ? (
                        <VideoCaption
                          caption={video.caption}
                          expanded={isCaptionExpanded}
                          onExpand={() => expandCaption(rowKey)}
                          onCollapse={() => collapseCaption(rowKey)}
                        />
                      ) : null}
                      {video.musicTitle ? (
                        <p className="video-meta__music">
                          <i className="fa-solid fa-music" aria-hidden />
                          <span>{video.musicTitle}</span>
                        </p>
                      ) : null}
                    </div>

                    {hasVideoError ? (
                      <div className="video-fallback" role="status">
                        Video đang được xử lý, thử tải lại sau vài giây.
                      </div>
                    ) : (
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
                    )}
                  </div>
                </div>
              </div>

              <VideoActionBox
                avatarUrl={video.avatarUrl}
                username={video.username}
                placement={actionBoxPlacement}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
