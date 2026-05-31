import { useEffect, useState } from "react";

import { createVideoComment, fetchVideoComments } from "../../../api/videoCommentsApi";
import { useAuth } from "../../auth/hooks/useAuth";
import { defaultAvatar, getUserAvatarSrc } from "../../../shared/lib/userAvatar";

const COMMENT_PAGE_SIZE = 20;

function countComments(comments) {
  return comments.reduce((total, comment) => total + 1 + (comment.replies?.length ?? 0), 0);
}

function formatRelativeTime(value) {
  const time = Date.parse(value || "");
  if (!Number.isFinite(time)) {
    return "Vừa xong";
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (diffSeconds < 60) return "Vừa xong";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(time);
}

function normalizeComment(comment) {
  return {
    id: comment?.id != null ? String(comment.id) : `comment-${Date.now()}`,
    videoId: comment?.videoId ?? null,
    parentCommentId: comment?.parentCommentId ?? null,
    authorName: comment?.authorName || "Người dùng",
    avatarUrl: comment?.avatarUrl || "",
    content: comment?.content || "",
    createdAt: comment?.createdAt ?? null,
    createdAtLabel: formatRelativeTime(comment?.createdAt),
    likeCount: comment?.likeCount ?? 0,
    replyCount: comment?.replyCount ?? 0,
    videoCommentCount: comment?.videoCommentCount ?? null,
    replies: Array.isArray(comment?.replies) ? comment.replies.map(normalizeComment) : [],
  };
}

function belongsToVideo(comment, videoId) {
  return Number(comment?.videoId) === Number(videoId);
}

function replaceOrInsert(comments, nextComment, prepend = true) {
  const nextId = String(nextComment.id);
  let found = false;
  const updatedComments = comments.map((comment) => {
    if (String(comment.id) !== nextId) {
      return comment;
    }

    found = true;
    return {
      ...nextComment,
      replies: nextComment.replies?.length ? nextComment.replies : comment.replies ?? [],
    };
  });

  if (found) {
    return updatedComments;
  }

  return prepend ? [nextComment, ...comments] : [...comments, nextComment];
}

function upsertComment(comments, rawComment, prependRoot = true) {
  const nextComment = normalizeComment(rawComment);

  if (nextComment.parentCommentId) {
    let parentFound = false;
    const nextComments = comments.map((comment) => {
      if (String(comment.id) !== String(nextComment.parentCommentId)) {
        return comment;
      }

      parentFound = true;
      const replies = replaceOrInsert(comment.replies ?? [], nextComment, false);
      return {
        ...comment,
        replyCount: Math.max(comment.replyCount ?? 0, replies.length),
        replies,
      };
    });

    return parentFound ? nextComments : comments;
  }

  return replaceOrInsert(comments, nextComment, prependRoot);
}

function mergeComments(baseComments, incomingComments, prependRoot = true) {
  return incomingComments.reduce(
    (currentComments, comment) => upsertComment(currentComments, comment, prependRoot),
    baseComments,
  );
}

function CommentReply({ reply }) {
  return (
    <article className="video-comment video-comment--reply">
      <img className="video-comment__avatar" src={reply.avatarUrl || defaultAvatar} alt="" />
      <div className="video-comment__main">
        <p className="video-comment__author">{reply.authorName}</p>
        <p className="video-comment__text">{reply.content}</p>
        <div className="video-comment__meta">
          <span>{reply.createdAtLabel}</span>
          <button type="button" className="video-comment__reply-action">
            Trả lời
          </button>
        </div>
      </div>
      <button type="button" className="video-comment__like" aria-label="Thích câu trả lời">
        <i className="fa-regular fa-heart" aria-hidden />
        <span>{reply.likeCount ?? 0}</span>
      </button>
    </article>
  );
}

function CommentItem({ comment, expanded, onToggleReplies }) {
  const replies = Array.isArray(comment.replies) ? comment.replies : [];
  const hasReplies = replies.length > 0;

  return (
    <article className="video-comment">
      <div className="video-comment__row">
        <img className="video-comment__avatar" src={comment.avatarUrl || defaultAvatar} alt="" />
        <div className="video-comment__main">
          <p className="video-comment__author">
            {comment.authorName}
            {comment.followed ? <span className="video-comment__followed"> · Đã follow</span> : null}
          </p>
          <p className="video-comment__text">{comment.content}</p>
          <div className="video-comment__meta">
            <span>{comment.createdAtLabel}</span>
            <button type="button" className="video-comment__reply-action">
              Trả lời
            </button>
          </div>

          {hasReplies && !expanded ? (
            <button
              type="button"
              className="video-comment__reply-toggle"
              aria-expanded={expanded}
              onClick={() => onToggleReplies(comment.id)}
            >
              <span className="video-comment__reply-toggle-line" aria-hidden />
              <span>{`Xem ${replies.length} câu trả lời`}</span>
              <i className="fa-solid fa-chevron-down" aria-hidden />
            </button>
          ) : null}

          {hasReplies && expanded ? (
            <>
              <div className="video-comment__replies">
                {replies.map((reply) => (
                  <CommentReply key={reply.id} reply={reply} />
                ))}
              </div>
              <button
                type="button"
                className="video-comment__reply-toggle video-comment__reply-toggle--hide"
                aria-expanded={expanded}
                onClick={() => onToggleReplies(comment.id)}
              >
                <span className="video-comment__reply-toggle-line" aria-hidden />
                <span>Ẩn</span>
                <i className="fa-solid fa-chevron-up" aria-hidden />
              </button>
            </>
          ) : null}
        </div>
        <button type="button" className="video-comment__like" aria-label="Thích bình luận">
          <i className="fa-regular fa-heart" aria-hidden />
          <span>{comment.likeCount ?? 0}</span>
        </button>
      </div>
    </article>
  );
}

function VideoCommentPanel({ open, video, onClose, onCommentCountChange }) {
  const fallbackCommentCount = Number(video?.commentCount ?? 0);
  const videoId = Number(video?.id);
  const hasVideoId = Number.isFinite(videoId) && videoId > 0;
  const videoKey = hasVideoId ? String(videoId) : null;
  const { isLoggedIn, user } = useAuth();
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentState, setCommentState] = useState({
    videoKey: null,
    comments: [],
    loading: false,
    loadingMore: false,
    hasMore: false,
    error: null,
  });
  const [expandedReplyState, setExpandedReplyState] = useState({
    videoKey: null,
    ids: new Set(),
  });
  const trimmedDraft = draft.trim();
  const avatarSrc = getUserAvatarSrc(user);
  const comments =
    open && commentState.videoKey === videoKey && Array.isArray(commentState.comments)
      ? commentState.comments
      : [];
  const loading = Boolean(open && videoKey && (commentState.videoKey !== videoKey || commentState.loading));
  const loadingMore = Boolean(open && commentState.videoKey === videoKey && commentState.loadingMore);
  const error = open && commentState.videoKey === videoKey ? commentState.error : null;
  const expandedReplyIds =
    expandedReplyState.videoKey === videoKey ? expandedReplyState.ids : new Set();
  const loadedCommentCount = countComments(comments);
  const displayCommentCount = Math.max(
    loadedCommentCount,
    Number.isFinite(fallbackCommentCount) ? fallbackCommentCount : 0,
  );
  const hasMoreComments =
    Boolean(commentState.videoKey === videoKey && commentState.hasMore && comments.length >= COMMENT_PAGE_SIZE);

  useEffect(() => {
    if (!open || !hasVideoId) {
      return undefined;
    }

    let ignore = false;
    setCommentState({
      videoKey,
      comments: [],
      loading: true,
      loadingMore: false,
      hasMore: false,
      error: null,
    });

    fetchVideoComments(videoId, { limit: COMMENT_PAGE_SIZE })
      .then((loadedComments) => {
        if (ignore) return;
        const normalizedComments = Array.isArray(loadedComments)
          ? loadedComments.filter((comment) => belongsToVideo(comment, videoId)).map(normalizeComment)
          : [];

        setCommentState((currentState) => {
          const currentComments = currentState.videoKey === videoKey ? currentState.comments : [];
          return {
            videoKey,
            comments: mergeComments(normalizedComments, currentComments),
            loading: false,
            loadingMore: false,
            hasMore: normalizedComments.length === COMMENT_PAGE_SIZE,
            error: null,
          };
        });
      })
      .catch((err) => {
        if (ignore) return;
        setCommentState({
          videoKey,
          comments: [],
          loading: false,
          loadingMore: false,
          hasMore: false,
          error: err?.message || "Không tải được bình luận.",
        });
      });

    return () => {
      ignore = true;
    };
  }, [hasVideoId, onCommentCountChange, open, videoId, videoKey]);

  const toggleReplies = (commentId) => {
    setExpandedReplyState((currentState) => {
      const currentIds = currentState.videoKey === videoKey ? currentState.ids : new Set();
      const nextIds = new Set(currentIds);

      if (nextIds.has(commentId)) {
        nextIds.delete(commentId);
      } else {
        nextIds.add(commentId);
      }

      return { videoKey, ids: nextIds };
    });
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!trimmedDraft || !hasVideoId || submitting || !isLoggedIn) return;

    try {
      setSubmitting(true);
      const savedComment = await createVideoComment(videoId, { content: trimmedDraft });
      if (!belongsToVideo(savedComment, videoId)) {
        return;
      }

      setCommentState((currentState) => {
        if (currentState.videoKey !== videoKey) {
          return currentState;
        }

        return {
          ...currentState,
          comments: upsertComment(currentState.comments, savedComment),
          loading: false,
          error: null,
        };
      });

      const nextCount = Number(savedComment?.videoCommentCount);
      if (Number.isFinite(nextCount)) {
        onCommentCountChange?.(videoKey, nextCount);
      }
      setDraft("");
    } catch (err) {
      setCommentState((currentState) => ({
        ...currentState,
        error: currentState.comments.length ? null : err?.message || "Không gửi được bình luận.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const loadMoreComments = async () => {
    if (!hasVideoId || loadingMore || !comments.length) return;

    const lastComment = comments[comments.length - 1];
    try {
      setCommentState((currentState) => ({
        ...currentState,
        loadingMore: true,
        error: null,
      }));
      const loadedComments = await fetchVideoComments(videoId, {
        beforeCommentId: lastComment.id,
        limit: COMMENT_PAGE_SIZE,
      });
      const normalizedComments = Array.isArray(loadedComments)
        ? loadedComments.filter((comment) => belongsToVideo(comment, videoId)).map(normalizeComment)
        : [];

      setCommentState((currentState) => {
        if (currentState.videoKey !== videoKey) {
          return currentState;
        }

        return {
          ...currentState,
          comments: mergeComments(currentState.comments, normalizedComments, false),
          loadingMore: false,
          hasMore: normalizedComments.length === COMMENT_PAGE_SIZE,
          error: null,
        };
      });
    } catch (err) {
      setCommentState((currentState) => ({
        ...currentState,
        loadingMore: false,
        error: currentState.comments.length ? null : err?.message || "Không tải được bình luận.",
      }));
    }
  };

  const bodyClassName = [
    "video-comments-panel__body",
    comments.length > 0 ? "video-comments-panel__body--list" : "video-comments-panel__body--empty",
  ].join(" ");
  const composerDisabled = !open || !hasVideoId || !isLoggedIn;
  const inputPlaceholder = isLoggedIn ? "Thêm bình luận..." : "Đăng nhập để bình luận";

  return (
    <aside
      className={`video-comments-panel${open ? " video-comments-panel--open" : ""}`}
      aria-hidden={!open}
      aria-label="Bình luận video"
    >
      <div className="video-comments-panel__header">
        <h2 className="video-comments-panel__title">
          Bình luận <span>{displayCommentCount}</span>
        </h2>
        <button
          type="button"
          className="video-comments-panel__close"
          aria-label="Đóng bình luận"
          tabIndex={open ? 0 : -1}
          onClick={onClose}
        >
          <i className="fa-solid fa-xmark" aria-hidden />
        </button>
      </div>

      <div className={bodyClassName}>
        {loading ? (
          <p className="video-comments-panel__empty">Đang tải bình luận...</p>
        ) : error ? (
          <p className="video-comments-panel__empty">{error}</p>
        ) : comments.length > 0 ? (
          <div className="video-comments-panel__list">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                expanded={expandedReplyIds.has(comment.id)}
                onToggleReplies={toggleReplies}
              />
            ))}
            {hasMoreComments ? (
              <button
                type="button"
                className="video-comments-panel__load-more"
                disabled={loadingMore}
                tabIndex={open ? 0 : -1}
                onClick={loadMoreComments}
              >
                {loadingMore ? "Đang tải..." : "Xem thêm bình luận"}
              </button>
            ) : null}
          </div>
        ) : (
          <p className="video-comments-panel__empty">Chưa có bình luận</p>
        )}
      </div>

      <form className="video-comments-panel__composer" onSubmit={submitComment}>
        <img className="video-comments-panel__composer-avatar" src={avatarSrc} alt="" />
        <div className="video-comments-panel__composer-input-wrap">
          <input
            className="video-comments-panel__composer-input"
            type="text"
            value={draft}
            placeholder={inputPlaceholder}
            disabled={composerDisabled}
            tabIndex={open ? 0 : -1}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button
            type="button"
            className="video-comments-panel__composer-tool"
            aria-label="Nhắc tên người dùng"
            disabled={composerDisabled}
            tabIndex={open ? 0 : -1}
          >
            @
          </button>
          <button
            type="button"
            className="video-comments-panel__composer-tool"
            aria-label="Chèn biểu cảm"
            disabled={composerDisabled}
            tabIndex={open ? 0 : -1}
          >
            <i className="fa-regular fa-face-smile" aria-hidden />
          </button>
        </div>
        <button
          type="submit"
          className="video-comments-panel__composer-submit"
          aria-label="Gửi bình luận"
          disabled={composerDisabled || !trimmedDraft || submitting}
          tabIndex={open ? 0 : -1}
        >
          <i className={submitting ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-arrow-up"} aria-hidden />
        </button>
      </form>
    </aside>
  );
}

export default VideoCommentPanel;
