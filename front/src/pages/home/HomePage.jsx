import { useCallback, useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { followUser, unfollowUser } from "../../api/followsApi";
import { recordVideoShare, recordVideoView } from "../../api/videoInteractionsApi";
import { likeVideo, unlikeVideo } from "../../api/videoLikesApi";
import { fetchVideoFeedPage } from "../../api/videosApi";
import VideoCommentPanel from "../../features/comments/components/VideoCommentPanel";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { openLoginModal } from "../../features/auth/model/authUi";
import VideoActionBox from "../../widgets/video-action-box/VideoActionBox";
import "./HomePage.css";

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

//feed video API trả về rất nhiều trường khác nhau tùy video, nên tạm viết thủ công thế này để dễ xử lý sau này, tránh lỗi kiểu dữ liệu, đồng thời chuẩn hóa một số thứ như URL playback, thumbnail, username, avatar, stats... Cũng là để tránh việc phải xử lý nhiều trường hợp null/undefined ở component chính bên dưới cho đỡ rối. Còn nếu API đã ổn định và thống nhất thì có thể bỏ qua bước này và đọc trực tiếp từ API luôn cũng được.
async function fetchFeedPage(cursor) {
  return fetchVideoFeedPage({ cursor, limit: FEED_PAGE_LIMIT });
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
  const viewer = video.viewer || {};

  return {
    ...video,
    caption: video.caption || "",
    createdAt: video.createdAt,
    videoUrl: originalVideoUrl,
    thumbnailUrl: getThumbnailUrl(video),
    duration: video?.video?.duration ?? video.duration ?? null,
    authorId: video.authorId ?? video.userId ?? author.id ?? null,
    username: video.username ?? author.username ?? author.name ?? null,
    avatarUrl: video.avatarUrl ?? author.avatar ?? null,
    musicTitle: video.musicTitle ?? music.title ?? "Âm thanh gốc",
    likeCount: video.likeCount ?? stats.likes ?? 0,
    commentCount: video.commentCount ?? stats.comments ?? 0,
    viewCount: video.viewCount ?? stats.views ?? 0,
    shareCount: video.shareCount ?? stats.shares ?? 0,
    isLiked: Boolean(video.isLiked ?? video.liked ?? viewer.liked),
    isFollowed: Boolean(video.isFollowed ?? video.followed ?? viewer.followed),
    followerCount: video.followerCount ?? author.followerCount ?? null,
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
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const currentUserId = user?.id ?? null;
  const pinnedVideoId = location.state?.uploadedVideoId;
  const pinnedVideo = location.state?.uploadedVideo;
  const [videos, setVideos] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [failedVideos, setFailedVideos] = useState(() => new Set());
  const [expandedCaptions, setExpandedCaptions] = useState(() => new Set());
  const [videoRatios, setVideoRatios] = useState({});
  const [likeLoadingVideoIds, setLikeLoadingVideoIds] = useState(() => new Set());
  const [followLoadingUserIds, setFollowLoadingUserIds] = useState(() => new Set());
  /** Một lần bật/tắt tiếng & mức volume cho cả feed (giống TikTok) */
  const [feedAudio, setFeedAudio] = useState(readFeedAudio);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);

  const containerRef = useRef(null);
  const videoRefs = useRef([]);
  const feedAudioRef = useRef(feedAudio);
  const activeIndexRef = useRef(activeIndex);
  const interactionSessionRef = useRef(null);
  const isLoggedInRef = useRef(isLoggedIn);
  const videosRef = useRef(videos);
  const nextCursorRef = useRef(null);
  const loadingFeedRef = useRef(false);

  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  useEffect(() => {
    feedAudioRef.current = feedAudio;
    saveFeedAudio(feedAudio);
  }, [feedAudio]);

  const closeCommentPanel = useCallback(() => {
    setIsCommentPanelOpen(false);
  }, []);

  const toggleCommentPanel = useCallback((index) => {
    const isCurrentActiveVideo = index === activeIndexRef.current;
    if (!isCurrentActiveVideo) {
      activeIndexRef.current = index;
      setActiveIndex(index);
    }

    setIsCommentPanelOpen((currentOpen) => (currentOpen && isCurrentActiveVideo ? false : true));
  }, []);

  const updateVideoCommentCount = useCallback((videoKey, nextCount) => {
    const normalizedCount = Number(nextCount);
    if (!videoKey || !Number.isFinite(normalizedCount)) {
      return;
    }

    setVideos((currentVideos) =>
      currentVideos.map((video) => {
        const currentVideoKey = video?.id != null ? String(video.id) : null;
        if (currentVideoKey !== String(videoKey)) {
          return video;
        }

        return {
          ...video,
          commentCount: normalizedCount,
          stats: video.stats ? { ...video.stats, comments: normalizedCount } : video.stats,
        };
      }),
    );
  }, []);

  const updateAuthorFollowState = useCallback((authorId, followed, followerCount = null) => {
    if (authorId == null) return;

    setVideos((currentVideos) =>
      currentVideos.map((video) => {
        if (String(video?.authorId) !== String(authorId)) {
          return video;
        }

        return {
          ...video,
          isFollowed: Boolean(followed),
          followerCount: followerCount ?? video.followerCount,
          author: video.author
            ? {
                ...video.author,
                followerCount: followerCount ?? video.author.followerCount,
              }
            : video.author,
        };
      }),
    );
  }, []);

  const updateVideoLikeState = useCallback((videoId, liked, likeCount = null) => {
    if (videoId == null) return;

    setVideos((currentVideos) =>
      currentVideos.map((video) => {
        if (String(video?.id) !== String(videoId)) {
          return video;
        }

        return {
          ...video,
          isLiked: liked == null ? video.isLiked : Boolean(liked),
          likeCount: likeCount ?? video.likeCount,
          stats: video.stats
            ? {
                ...video.stats,
                likes: likeCount ?? video.stats.likes,
              }
            : video.stats,
        };
      }),
    );
  }, []);

  const updateVideoShareState = useCallback((videoId, shareCount = null) => {
    if (videoId == null) return;

    setVideos((currentVideos) =>
      currentVideos.map((video) => {
        if (String(video?.id) !== String(videoId)) {
          return video;
        }

        const currentShareCount = Number(video.shareCount);
        const nextShareCount =
          shareCount ??
          (Number.isFinite(currentShareCount) ? currentShareCount + 1 : video.shareCount);

        return {
          ...video,
          shareCount: nextShareCount,
          stats: video.stats
            ? {
                ...video.stats,
                shares: nextShareCount,
              }
            : video.stats,
        };
      }),
    );
  }, []);

  const flushVideoInteraction = useCallback((options = {}) => {
    const session = interactionSessionRef.current;
    if (!session?.videoId) return;

    interactionSessionRef.current = null;

    if (!isLoggedInRef.current) return;

    const watchTime = Math.max(0, Math.round((Date.now() - session.startedAt) / 1000));
    if (watchTime <= 0) return;

    recordVideoView(session.videoId, watchTime, options).catch((err) => {
      if (err?.status !== 401 && err?.status !== 403) {
        console.error(err);
      }
    });
  }, []);

  const startVideoInteraction = useCallback((index) => {
    const video = videosRef.current[index];
    const videoId = video?.id;
    if (videoId == null) {
      interactionSessionRef.current = null;
      return;
    }

    const currentSession = interactionSessionRef.current;
    if (String(currentSession?.videoId) === String(videoId)) {
      return;
    }

    flushVideoInteraction();
    interactionSessionRef.current = {
      videoId,
      startedAt: Date.now(),
    };
  }, [flushVideoInteraction]);

  const handleVideoShare = useCallback(
    async (videoId) => {
      if (videoId == null) return;

      if (!isLoggedIn) {
        openLoginModal();
        return;
      }

      updateVideoShareState(videoId);

      try {
        await recordVideoShare(videoId);
      } catch (err) {
        if (err?.status === 401 || err?.status === 403) {
          openLoginModal();
        } else {
          console.error(err);
        }
      }
    },
    [isLoggedIn, updateVideoShareState],
  );

  const toggleVideoLike = useCallback(
    async ({ videoId, isLiked, likeCount }) => {
      if (videoId == null) return;

      if (!isLoggedIn) {
        openLoginModal();
        return;
      }

      const videoKey = String(videoId);
      if (likeLoadingVideoIds.has(videoKey)) {
        return;
      }

      setLikeLoadingVideoIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.add(videoKey);
        return nextIds;
      });

      const nextLiked = !isLiked;
      const currentLikeCount = Number(likeCount);
      const optimisticLikeCount = Number.isFinite(currentLikeCount)
        ? Math.max(0, currentLikeCount + (nextLiked ? 1 : -1))
        : null;
      updateVideoLikeState(videoId, nextLiked, optimisticLikeCount);

      try {
        const status = nextLiked ? await likeVideo(videoId) : await unlikeVideo(videoId);
        updateVideoLikeState(videoId, status?.liked, status?.likeCount);
      } catch (err) {
        updateVideoLikeState(videoId, isLiked, likeCount);
        if (err?.status === 401 || err?.status === 403) {
          openLoginModal();
        } else {
          console.error(err);
        }
      } finally {
        setLikeLoadingVideoIds((currentIds) => {
          const nextIds = new Set(currentIds);
          nextIds.delete(videoKey);
          return nextIds;
        });
      }
    },
    [isLoggedIn, likeLoadingVideoIds, updateVideoLikeState],
  );

  const toggleAuthorFollow = useCallback(
    async ({ authorId, isFollowed }) => {
      if (authorId == null) return;

      if (!isLoggedIn) {
        openLoginModal();
        return;
      }

      if (currentUserId != null && String(currentUserId) === String(authorId)) {
        return;
      }

      const authorKey = String(authorId);
      if (followLoadingUserIds.has(authorKey)) {
        return;
      }

      setFollowLoadingUserIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.add(authorKey);
        return nextIds;
      });

      const nextFollowed = !isFollowed;
      updateAuthorFollowState(authorId, nextFollowed);

      try {
        const status = nextFollowed ? await followUser(authorId) : await unfollowUser(authorId);
        updateAuthorFollowState(authorId, status?.followed, status?.followerCount);
      } catch (err) {
        updateAuthorFollowState(authorId, isFollowed);
        if (err?.status === 401 || err?.status === 403) {
          openLoginModal();
        } else {
          console.error(err);
        }
      } finally {
        setFollowLoadingUserIds((currentIds) => {
          const nextIds = new Set(currentIds);
          nextIds.delete(authorKey);
          return nextIds;
        });
      }
    },
    [currentUserId, followLoadingUserIds, isLoggedIn, updateAuthorFollowState],
  );

  const openAuthorProfile = useCallback(
    ({ username }) => {
      const normalizedUsername = String(username || "").replace(/^@+/, "").trim();
      if (!normalizedUsername) return;
      navigate(`/@${encodeURIComponent(normalizedUsername)}`);
    },
    [navigate],
  );

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
    startVideoInteraction(activeIndex);
  }, [activeIndex, pauseInactiveVideos, startVideoInteraction]);

  useEffect(() => {
    const flushBeforeLeaving = () => {
      flushVideoInteraction({ keepalive: true });
    };

    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") {
        flushBeforeLeaving();
      }
    };

    window.addEventListener("pagehide", flushBeforeLeaving);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("pagehide", flushBeforeLeaving);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      flushBeforeLeaving();
    };
  }, [flushVideoInteraction]);

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
        interactionSessionRef.current = null;
        setFailedVideos(new Set());
        setExpandedCaptions(new Set());
        setVideoRatios({});
        setIsCommentPanelOpen(false);
        setLikeLoadingVideoIds(new Set());
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
      startVideoInteraction(activeIndexRef.current);
    });

    return () => cancelAnimationFrame(raf);
  }, [playActiveVideo, startVideoInteraction, videos.length]);

  useEffect(() => {
    const el = videoRefs.current[activeIndex];
    if (!el) return;
    activeIndexRef.current = activeIndex;
    applyAudioToVideo(el, activeIndex, feedAudio);
    playVideo(el, activeIndex);
  }, [applyAudioToVideo, feedAudio, activeIndex, playVideo, videos]);

  useEffect(() => {
    if (!isCommentPanelOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeCommentPanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeCommentPanel, isCommentPanelOpen]);

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
  const commentPanelVideo = isCommentPanelOpen ? videos[activeIndex] : null;
  const showCommentPanel = Boolean(commentPanelVideo);

  return (
    <>
      <div
        ref={containerRef}
        className={`feed-container${showCommentPanel ? " feed-container--comments-open" : ""}`}
      >
        {videos.map((video, index) => {
          const rowKey = clipListKey(video, index);
          const hasVideoError = failedVideos.has(rowKey);
          const isCaptionExpanded = expandedCaptions.has(rowKey);
          const videoRatio = videoRatios[rowKey] || 9 / 16;
          const isLandscapeVideo = videoRatio >= 1;
          const actionBoxPlacement = videoRatio >= 1 ? "center" : "bottom";
          return (
            <div key={rowKey} className="feed-item">
              <div className="feed-stage">
                <div
                  className={`video-frame${isLandscapeVideo ? " video-frame--landscape" : ""}`}
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
                        <p className="video-meta__author">
                          {video.username || "Người dùng TikTok"}
                        </p>
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
                  authorId={video.authorId}
                  currentUserId={currentUserId}
                  avatarUrl={video.avatarUrl}
                  username={video.username}
                  isFollowed={video.isFollowed}
                  followLoading={followLoadingUserIds.has(String(video.authorId))}
                  counts={{
                    likes: video.likeCount,
                    liked: video.isLiked,
                    comments: video.commentCount,
                    saves: video.saveCount,
                    shares: video.shareCount,
                  }}
                  placement={actionBoxPlacement}
                  onOpenProfile={() => openAuthorProfile({ username: video.username })}
                  onFollowToggle={toggleAuthorFollow}
                  onLike={() =>
                    toggleVideoLike({
                      videoId: video.id,
                      isLiked: video.isLiked,
                      likeCount: video.likeCount,
                    })
                  }
                  onComment={() => toggleCommentPanel(index)}
                  onShare={() => handleVideoShare(video.id)}
                  isCommentOpen={showCommentPanel && activeIndex === index}
                />
              </div>
            </div>
          );
        })}
      </div>

      <VideoCommentPanel
        open={showCommentPanel}
        video={commentPanelVideo}
        onClose={closeCommentPanel}
        onCommentCountChange={updateVideoCommentCount}
      />
    </>
  );
}
