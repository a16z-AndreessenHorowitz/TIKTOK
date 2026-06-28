import { useCallback, useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { followUser, unfollowUser } from "../../api/followsApi";
import { recordVideoShare, recordVideoViewBatch } from "../../api/videoInteractionsApi";
import { likeVideo, unlikeVideo } from "../../api/videoLikesApi";
import { saveVideo, unsaveVideo } from "../../api/videoSavesApi";
import { fetchVideoFeedPage } from "../../api/videosApi";
import VideoCommentPanel from "../../features/comments/components/VideoCommentPanel";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { openLoginModal } from "../../features/auth/model/authUi";
import VideoActionBox from "../../widgets/video-action-box/VideoActionBox";
import "../../styles/HomePage.css";

const FEED_AUDIO_KEY = "tt_feed_audio";
const FEED_PAGE_LIMIT = 8;
const FEED_PREFETCH_DISTANCE = 3;
const MOBILE_FEED_QUERY = "(max-width: 767px)";
/** Số video tích lũy trước khi tự động gửi batch */
const WATCH_BATCH_FLUSH_SIZE = 4;
const DEFAULT_FEED_AUDIO = {
  volume: 0.8,
  muted: true,
  lastVolume: 0.8,
};

function clampAudioVolume(value, fallback = DEFAULT_FEED_AUDIO.volume) {
  const volume = Number(value);
  return Number.isFinite(volume) ? Math.min(Math.max(volume, 0), 1) : fallback;
}

function normalizeFeedAudio(feedAudio = DEFAULT_FEED_AUDIO) {
  const volume = clampAudioVolume(feedAudio.volume);
  const lastVolume = clampAudioVolume(feedAudio.lastVolume, DEFAULT_FEED_AUDIO.lastVolume);
  const hasAudibleVolume = volume > 0;

  return {
    volume,
    muted: Boolean(feedAudio.muted) || !hasAudibleVolume,
    lastVolume: lastVolume > 0 ? lastVolume : DEFAULT_FEED_AUDIO.lastVolume,
  };
}

function isFeedAudioMuted(feedAudio) {
  const audio = normalizeFeedAudio(feedAudio);
  return audio.muted || audio.volume <= 0;
}

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
async function fetchFeedPage(cursor, excludeIds = []) {
  return fetchVideoFeedPage({ cursor, limit: FEED_PAGE_LIMIT, excludeIds });
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
    saveCount: video.saveCount ?? stats.saves ?? 0,
    isLiked: Boolean(video.isLiked ?? video.liked ?? viewer.liked),
    isFollowed: Boolean(video.isFollowed ?? video.followed ?? viewer.followed),
    isSaved: Boolean(video.isSaved ?? video.saved ?? viewer.saved),
    followerCount: video.followerCount ?? author.followerCount ?? null,
    originalVideoUrl,
    playbackUrl: originalVideoUrl,
    sortIndex: index,
  };
}

function prepareFeed(feed, pinnedVideo) {
  const feedItems = Array.isArray(feed) ? feed : [];
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
    });
}

function readFeedAudio() {
  try {
    const raw = sessionStorage.getItem(FEED_AUDIO_KEY);
    if (!raw) return DEFAULT_FEED_AUDIO;

    const parsed = JSON.parse(raw);
    return normalizeFeedAudio(parsed);
  } catch {
    return DEFAULT_FEED_AUDIO;
  }
}

function saveFeedAudio(feedAudio) {
  sessionStorage.setItem(FEED_AUDIO_KEY, JSON.stringify(normalizeFeedAudio(feedAudio)));
}

function isMobileFeedViewport() {
  if (typeof window === "undefined") return false;
  return Boolean(window.matchMedia?.(MOBILE_FEED_QUERY)?.matches);
}

function getPlaybackVolume(feedAudio) {
  return isMobileFeedViewport() ? 1 : feedAudio.volume;
}

function isVolumeControlEvent(event) {
  const target = event?.target;
  return (
    typeof Element !== "undefined" &&
    target instanceof Element &&
    Boolean(target.closest(".volume-box"))
  );
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
  const [saveLoadingVideoIds, setSaveLoadingVideoIds] = useState(() => new Set());
  const [followLoadingUserIds, setFollowLoadingUserIds] = useState(() => new Set());
  const [feedStatus, setFeedStatus] = useState("loading");
  const [feedErrorMessage, setFeedErrorMessage] = useState("");
  /** Một lần bật/tắt tiếng & mức volume cho cả feed (giống TikTok) */
  const [feedAudio, setFeedAudio] = useState(readFeedAudio);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);

  const containerRef = useRef(null);
  const videoRefs = useRef([]);
  const feedAudioRef = useRef(feedAudio);
  const activeIndexRef = useRef(activeIndex);
  const interactionSessionRef = useRef(null);
  /** currentTime của video ở lần timeupdate trước — để tính delta chính xác */
  const lastVideoTimeRef = useRef(0);
  /** Buffer tích lũy watch-time, flush theo batch thay vì gửi từng cái */
  const watchBatchRef = useRef([]);
  const isLoggedInRef = useRef(isLoggedIn);
  const videosRef = useRef(videos);
  const nextCursorRef = useRef(null);
  const loadingFeedRef = useRef(false);
  const feedReloadRequestRef = useRef(0);
  const mobileAudioUnlockedRef = useRef(false);
  const mobileAudioUnlockingRef = useRef(false);
  const mobileAudioUnlockAttemptRef = useRef(0);
  const soundPointerHandledRef = useRef(false);

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

  const loadNextFeedPage = useCallback(async () => {
    const cursor = nextCursorRef.current;
    if (!cursor || loadingFeedRef.current) return;

    loadingFeedRef.current = true;

    try {
      const excludeIds = videosRef.current
        .map((video) => video?.id)
        .filter((id) => id != null);
      const page = await fetchFeedPage(cursor, excludeIds);

      nextCursorRef.current = page.nextCursor;
      setNextCursor(page.nextCursor);
      setVideos((prev) => prepareFeed([...prev, ...page.items], pinnedVideo));
    } catch (err) {
      console.error(err);
    } finally {
      loadingFeedRef.current = false;
    }
  }, [pinnedVideo]);

  const handleFeedScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !nextCursorRef.current || loadingFeedRef.current) return;

    const remainingScroll =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (remainingScroll <= container.clientHeight * 2) {
      loadNextFeedPage();
    }
  }, [loadNextFeedPage]);

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

  const updateVideoSaveState = useCallback((videoId, saved, saveCount = null) => {
    if (videoId == null) return;

    setVideos((currentVideos) =>
      currentVideos.map((video) => {
        if (String(video?.id) !== String(videoId)) {
          return video;
        }

        return {
          ...video,
          isSaved: Boolean(saved),
          saveCount: saveCount ?? video.saveCount,
          stats: video.stats
            ? {
                ...video.stats,
                saves: saveCount ?? video.stats?.saves,
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

  /**
   * Flush batch buffer lên server.
   * @param {{ keepalive?: boolean }} options
   */
  const flushWatchBatch = useCallback((options = {}) => {
    if (!isLoggedInRef.current) return;
    const items = watchBatchRef.current.splice(0); // lấy hết + xóa buffer
    if (items.length === 0) return;

    recordVideoViewBatch(items, options).catch((err) => {
      if (err?.status !== 401 && err?.status !== 403) {
        console.error(err);
      }
    });
  }, []);

  /**
   * Kết thúc session xem của video hiện tại:
   * push watch-time vào buffer, tự flush nếu buffer đủ WATCH_BATCH_FLUSH_SIZE.
   */
  const flushVideoInteraction = useCallback((options = {}) => {
    const session = interactionSessionRef.current;
    if (!session?.videoId) return;

    const watchTime = session.watchedSeconds ?? 0;
    interactionSessionRef.current = null;
    lastVideoTimeRef.current = 0;

    if (!isLoggedInRef.current) return;
    if (watchTime < 1.0) return; // bỏ qua scroll quá nhanh (< 1 giây)

    watchBatchRef.current.push({ videoId: session.videoId, watchTime });

    // Tự flush khi buffer đầy
    if (watchBatchRef.current.length >= WATCH_BATCH_FLUSH_SIZE) {
      flushWatchBatch(options);
    }
  }, [flushWatchBatch]);

  const startVideoInteraction = useCallback((index) => {
    const video = videosRef.current[index];
    const videoId = video?.id;
    if (videoId == null) {
      interactionSessionRef.current = null;
      lastVideoTimeRef.current = 0;
      return;
    }

    const currentSession = interactionSessionRef.current;
    if (String(currentSession?.videoId) === String(videoId)) {
      return;
    }

    flushVideoInteraction();
    interactionSessionRef.current = {
      videoId,
      watchedSeconds: 0,
    };
    // Khởi tạo lastVideoTime bằng currentTime của video element (nếu có)
    const videoEl = videoRefs.current[index];
    lastVideoTimeRef.current = videoEl?.currentTime ?? 0;
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

  const toggleVideoSave = useCallback(
    async ({ videoId, isSaved, saveCount }) => {
      if (videoId == null) return;

      if (!isLoggedIn) {
        openLoginModal();
        return;
      }

      const videoKey = String(videoId);
      if (saveLoadingVideoIds.has(videoKey)) {
        return;
      }

      setSaveLoadingVideoIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.add(videoKey);
        return nextIds;
      });

      const nextSaved = !isSaved;
      const currentSaveCount = Number(saveCount);
      const optimisticSaveCount = Number.isFinite(currentSaveCount)
        ? Math.max(0, currentSaveCount + (nextSaved ? 1 : -1))
        : null;
      updateVideoSaveState(videoId, nextSaved, optimisticSaveCount);

      try {
        const status = nextSaved ? await saveVideo(videoId) : await unsaveVideo(videoId);
        updateVideoSaveState(videoId, status?.saved, status?.saveCount);
      } catch (err) {
        updateVideoSaveState(videoId, isSaved, saveCount);
        if (err?.status === 401 || err?.status === 403) {
          openLoginModal();
        } else {
          console.error(err);
        }
      } finally {
        setSaveLoadingVideoIds((currentIds) => {
          const nextIds = new Set(currentIds);
          nextIds.delete(videoKey);
          return nextIds;
        });
      }
    },
    [isLoggedIn, saveLoadingVideoIds, updateVideoSaveState],
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
      const session = interactionSessionRef.current;
      const videoId = videosRef.current[index]?.id;
      if (session?.videoId != null && videoId != null && String(session.videoId) === String(videoId)) {
        flushVideoInteraction();
      }
      video.muted = true;
      video.pause();
      video.currentTime = 0;
    });
  }, [flushVideoInteraction]);

  const applyAudioToVideo = useCallback((
    video,
    index,
    audio = feedAudioRef.current,
    activeVideoIndex = activeIndexRef.current,
  ) => {
    if (!video) return;
    const isActiveVideo = index === activeVideoIndex;
    const normalizedAudio = normalizeFeedAudio(audio);
    const playbackVolume = isActiveVideo ? getPlaybackVolume(normalizedAudio) : 0;
    const shouldMute = !isActiveVideo || normalizedAudio.muted || playbackVolume <= 0;

    video.volume = playbackVolume;
    video.muted = shouldMute;

    if (!shouldMute) {
      video.removeAttribute("muted");
      video.defaultMuted = false;
    }
  }, []);

  const syncFeedAudioToVideos = useCallback((audio, activeVideoIndex = activeIndexRef.current) => {
    videoRefs.current.forEach((video, index) => {
      applyAudioToVideo(video, index, audio, activeVideoIndex);
    });
  }, [applyAudioToVideo]);

  const commitFeedAudio = useCallback((
    nextAudio,
    {
      activeVideoIndex = activeIndexRef.current,
      syncActiveVideo = false,
      retryPlay = false,
      fallbackToMuted = false,
    } = {},
  ) => {
    const normalizedAudio = normalizeFeedAudio(nextAudio);

    if (Number.isInteger(activeVideoIndex)) {
      activeIndexRef.current = activeVideoIndex;
      setActiveIndex((currentIndex) =>
        currentIndex === activeVideoIndex ? currentIndex : activeVideoIndex,
      );
    }

    feedAudioRef.current = normalizedAudio;
    setFeedAudio(normalizedAudio);

    if (!syncActiveVideo) return;

    syncFeedAudioToVideos(normalizedAudio, activeVideoIndex);

    const video = videoRefs.current[activeVideoIndex];
    if (!video) return;

    if (!isFeedAudioMuted(normalizedAudio)) {
      video.removeAttribute("muted");
      video.defaultMuted = false;
      video.muted = false;
      video.volume = getPlaybackVolume(normalizedAudio);
    }

    if (!retryPlay) return;

    const playPromise = video.play();
    if (!playPromise?.catch) return;

    playPromise.catch((err) => {
      if (err?.name !== "NotAllowedError") return;
      if (!fallbackToMuted) return;

      const mutedAudio = normalizeFeedAudio({ ...normalizedAudio, muted: true });
      feedAudioRef.current = mutedAudio;
      setFeedAudio(mutedAudio);
      syncFeedAudioToVideos(mutedAudio, activeVideoIndex);
      video.play().catch(() => {});
    });
  }, [syncFeedAudioToVideos]);

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
      if (
        isMobileFeedViewport() &&
        (mobileAudioUnlockingRef.current || mobileAudioUnlockedRef.current)
      ) {
        return;
      }

      const mutedAudio = { ...feedAudioRef.current, muted: true };
      commitFeedAudio(mutedAudio, { syncActiveVideo: true });
      video.play().catch(() => {});
    });
  }, [applyAudioToVideo, commitFeedAudio, pauseInactiveVideos]);

  const playActiveVideo = useCallback((index = activeIndexRef.current) => {
    const video = videoRefs.current[index];
    if (video) {
      activeIndexRef.current = index;
      playVideo(video, index);
    }
  }, [playVideo]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    startVideoInteraction(activeIndex);
    pauseInactiveVideos(activeIndex);
  }, [activeIndex, pauseInactiveVideos, startVideoInteraction]);

  useEffect(() => {
    const flushBeforeLeaving = () => {
      // Flush session hiện tại vào buffer, rồi gửi toàn bộ buffer lên server
      flushVideoInteraction({ keepalive: true });
      flushWatchBatch({ keepalive: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Chỉ pause video — session giữ nguyên, timeupdate dừng tự nhiên
        const activeVideo = videoRefs.current[activeIndexRef.current];
        if (activeVideo && !activeVideo.paused) activeVideo.pause();
      } else if (document.visibilityState === "visible") {
        // Resume video, tiếp tục cộng dồn vào session cũ
        playActiveVideo(activeIndexRef.current);
      }
    };

    window.addEventListener("pagehide", flushBeforeLeaving);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flushBeforeLeaving);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flushBeforeLeaving();
    };
  }, [flushVideoInteraction, flushWatchBatch, playActiveVideo]);

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
      const requestId = feedReloadRequestRef.current + 1;
      feedReloadRequestRef.current = requestId;
      loadingFeedRef.current = true;
      setFeedStatus("loading");
      setFeedErrorMessage("");

      try {
        const page = await fetchFeedPage(null);
        if (cancelled || requestId !== feedReloadRequestRef.current) return;

        nextCursorRef.current = page.nextCursor;
        videoRefs.current = [];
        activeIndexRef.current = 0;
        containerRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        setNextCursor(page.nextCursor);
        setActiveIndex(0);
        interactionSessionRef.current = null;
        lastVideoTimeRef.current = 0;
        setFailedVideos(new Set());
        setExpandedCaptions(new Set());
        setVideoRatios({});
        setIsCommentPanelOpen(false);
        setLikeLoadingVideoIds(new Set());
        setVideos(prepareFeed(page.items, pinnedVideo));
        setFeedStatus("ready");
      } catch (err) {
        console.error(err);
        if (!cancelled && requestId === feedReloadRequestRef.current) {
          setVideos([]);
          setFeedStatus("error");
          setFeedErrorMessage(err?.message || "Không tải được danh sách video.");
        }
      } finally {
        if (requestId === feedReloadRequestRef.current) {
          loadingFeedRef.current = false;
          window.dispatchEvent(new CustomEvent("tt-home-refresh-complete"));
        }
      }
    };

    fetchData();
    window.addEventListener("tt-home-refresh", fetchData);

    return () => {
      cancelled = true;
      window.removeEventListener("tt-home-refresh", fetchData);
    };
  }, [pinnedVideo, pinnedVideoId]);

  useEffect(() => {
    if (!nextCursor) return;
    if (activeIndex < videos.length - FEED_PREFETCH_DISTANCE) return;

    loadNextFeedPage();
  }, [activeIndex, loadNextFeedPage, nextCursor, videos.length]);

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

          const index = videoRefs.current.findIndex((v) => v === video);
          if (index < 0) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {

            startVideoInteraction(index);
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
  }, [flushVideoInteraction, pauseInactiveVideos, playVideo, startVideoInteraction, videos]);

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

  const toggleSound = useCallback((index, event) => {
    if (Number.isInteger(index)) {
      activeIndexRef.current = index;
    }
    event?.stopPropagation?.();

    const prev = normalizeFeedAudio(feedAudioRef.current);
    const nextAudio = isFeedAudioMuted(prev)
      ? {
          ...prev,
          muted: false,
          volume: prev.lastVolume > 0 ? prev.lastVolume : DEFAULT_FEED_AUDIO.volume,
        }
      : {
          ...prev,
          muted: true,
          lastVolume: prev.volume > 0 ? prev.volume : prev.lastVolume,
        };

    commitFeedAudio(nextAudio, {
      activeVideoIndex: Number.isInteger(index) ? index : activeIndexRef.current,
      syncActiveVideo: true,
      retryPlay: !nextAudio.muted,
      fallbackToMuted: !nextAudio.muted,
    });
  }, [commitFeedAudio]);

  const handleSoundPointerDown = useCallback((index, event) => {
    if (event.pointerType === "mouse") return;

    soundPointerHandledRef.current = true;
    event.preventDefault();
    toggleSound(index, event);
  }, [toggleSound]);

  const handleSoundClick = useCallback((index, event) => {
    if (soundPointerHandledRef.current) {
      soundPointerHandledRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    toggleSound(index, event);
  }, [toggleSound]);

  const handleVolumeChange = useCallback((index, e) => {
    const v = parseFloat(e.target.value);
    const nextVolume = Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : DEFAULT_FEED_AUDIO.volume;
    const prev = normalizeFeedAudio(feedAudioRef.current);
    const nextAudio = {
      ...prev,
      volume: nextVolume,
      muted: nextVolume === 0,
      lastVolume: nextVolume > 0 ? nextVolume : prev.lastVolume,
    };

    commitFeedAudio(nextAudio, {
      activeVideoIndex: Number.isInteger(index) ? index : activeIndexRef.current,
      syncActiveVideo: true,
      retryPlay: nextVolume > 0,
      fallbackToMuted: nextVolume > 0,
    });
  }, [commitFeedAudio]);

  const unlockMobileFeedAudio = useCallback((event) => {
    if (isVolumeControlEvent(event)) return;
    if (
      !isMobileFeedViewport() ||
      mobileAudioUnlockedRef.current ||
      mobileAudioUnlockingRef.current
    ) {
      return;
    }

    const video = videoRefs.current[activeIndexRef.current];
    if (!video) return;

    const attemptId = mobileAudioUnlockAttemptRef.current + 1;
    mobileAudioUnlockAttemptRef.current = attemptId;
    mobileAudioUnlockingRef.current = true;

    const mobileAudio = { ...feedAudioRef.current, volume: 1, muted: false, lastVolume: 1 };
    commitFeedAudio(mobileAudio);

    video.pause();
    video.removeAttribute("muted");
    video.defaultMuted = false;
    applyAudioToVideo(video, activeIndexRef.current, mobileAudio);

    const playPromise = video.play();
    if (!playPromise?.then) {
      mobileAudioUnlockedRef.current = true;
      mobileAudioUnlockingRef.current = false;
      return;
    }

    playPromise.then(() => {
      if (attemptId !== mobileAudioUnlockAttemptRef.current) return;
      video.removeAttribute("muted");
      video.defaultMuted = false;
      video.muted = false;
      video.volume = 1;
      mobileAudioUnlockedRef.current = true;
      mobileAudioUnlockingRef.current = false;
    }).catch(() => {
      if (attemptId !== mobileAudioUnlockAttemptRef.current) return;
      mobileAudioUnlockingRef.current = false;
      if (!video.paused && !video.muted) {
        mobileAudioUnlockedRef.current = true;
        return;
      }

      mobileAudioUnlockedRef.current = false;
      const mutedAudio = { ...mobileAudio, muted: true };
      commitFeedAudio(mutedAudio, { syncActiveVideo: true });
      video.play().catch(() => {});
    });
  }, [applyAudioToVideo, commitFeedAudio]);

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
    const emptyTitle =
      feedStatus === "loading"
        ? "Đang tải video..."
        : feedStatus === "error"
          ? "Không tải được feed"
          : "Chưa có video";

    return (
      <div className="feed-state" role={feedStatus === "loading" ? "status" : "alert"}>
        <div>
          <p className="feed-state__title">{emptyTitle}</p>
          {feedStatus === "error" && feedErrorMessage ? (
            <p className="feed-state__detail">{feedErrorMessage}</p>
          ) : null}
        </div>
      </div>
    );
  }

  // =========================
  // VIDEO FEED
  // =========================
  const commentPanelVideo = isCommentPanelOpen ? videos[activeIndex] : null;
  const showCommentPanel = Boolean(commentPanelVideo);
  const isSoundMuted = isFeedAudioMuted(feedAudio);

  return (
    <>
      <div
        ref={containerRef}
        className={`feed-container${showCommentPanel ? " feed-container--comments-open" : ""}`}
        onScroll={handleFeedScroll}
        onPointerDownCapture={unlockMobileFeedAudio}
        onPointerUpCapture={unlockMobileFeedAudio}
        onTouchStartCapture={unlockMobileFeedAudio}
        onTouchEndCapture={unlockMobileFeedAudio}
        onClickCapture={unlockMobileFeedAudio}
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
                        onTimeUpdate={(e) => {
                          // Chỉ tính cho video đang active
                          if (index !== activeIndexRef.current) return;
                          const session = interactionSessionRef.current;
                          if (!session) return;

                          const currentTime = e.currentTarget.currentTime;
                          const diff = currentTime - lastVideoTimeRef.current;

                          // Loại trừ: seek/tua nhanh (diff >= 1s) hoặc lặp lại (diff < 0)
                          if (diff > 0 && diff < 1) {
                            session.watchedSeconds = (session.watchedSeconds ?? 0) + diff;
                          }
                          lastVideoTimeRef.current = currentTime;
                        }}
                        onEnded={() => flushVideoInteraction()}
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
                            onPointerDown={(event) => handleSoundPointerDown(index, event)}
                            onClick={(event) => handleSoundClick(index, event)}
                            aria-label={isSoundMuted ? "Bật tiếng" : "Tắt tiếng"}
                          >
                            {isSoundMuted ? (
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
                            onChange={(event) => handleVolumeChange(index, event)}
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
                    saved: video.isSaved,
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
                  onSave={() =>
                    toggleVideoSave({
                      videoId: video.id,
                      isSaved: video.isSaved,
                      saveCount: video.saveCount,
                    })
                  }
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
