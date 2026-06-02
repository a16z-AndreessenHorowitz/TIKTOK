import "./VideoActionBox.css";

import VideoCommentAction from "../../features/video-actions/components/VideoCommentAction";
import VideoLikeAction from "../../features/video-actions/components/VideoLikeAction";
import VideoSaveAction from "../../features/video-actions/components/VideoSaveAction";
import VideoShareAction from "../../features/video-actions/components/VideoShareAction";
import { defaultAvatar } from "../../shared/lib/userAvatar";

function getAvatarSrc(avatarUrl) {
  if (typeof avatarUrl === "string" && avatarUrl.trim()) {
    return avatarUrl.trim();
  }
  return defaultAvatar;
}

function VideoActionBox({
  authorId,
  currentUserId,
  avatarUrl,
  username,
  isFollowed = false,
  followLoading = false,
  counts = {},
  placement = "bottom",
  onFollowToggle,
  onOpenProfile,
  onLike,
  onComment,
  onSave,
  onShare,
  isCommentOpen = false,
}) {
  const avatarSrc = getAvatarSrc(avatarUrl);
  const displayName = username || "người đăng";
  const actionCounts = counts || {};
  const placementClassName = placement === "center" ? " VideoActionBox--center" : "";
  const canFollow =
    authorId != null && (currentUserId == null || String(authorId) !== String(currentUserId));
  const followLabel = isFollowed ? `Hủy follow ${displayName}` : `Follow ${displayName}`;

  return (
    <aside className={`VideoActionBox${placementClassName}`} aria-label="Tương tác video">
      <div className="VideoActionBox__profile">
        <button
          type="button"
          className="VideoActionBox__avatar-btn"
          aria-label={`Mở hồ sơ ${displayName}`}
          onClick={() => onOpenProfile?.({ authorId, username })}
        >
          <img className="VideoActionBox__avatar" src={avatarSrc} alt="" />
        </button>
        {canFollow ? (
          <button
            type="button"
            className={`VideoActionBox__follow-badge${
              isFollowed ? " VideoActionBox__follow-badge--followed" : ""
            }`}
            aria-label={followLabel}
            disabled={followLoading}
            onClick={() => onFollowToggle?.({ authorId, isFollowed: Boolean(isFollowed) })}
          >
            {followLoading ? (
              <i className="fa-solid fa-spinner VideoActionBox__follow-spinner" />
            ) : (
              <i className={isFollowed ? "fa-solid fa-check" : "fa-solid fa-plus"} />
            )}
          </button>
        ) : null}
      </div>

      <div className="VideoActionBox__list">
        <VideoLikeAction
          count={actionCounts.likes}
          active={Boolean(actionCounts.liked)}
          onClick={onLike}
        />
        <VideoCommentAction
          count={actionCounts.comments}
          onClick={onComment}
          active={isCommentOpen}
        />
        <VideoSaveAction
          count={actionCounts.saves}
          active={Boolean(actionCounts.saved)}
          onClick={onSave}
        />
        <VideoShareAction count={actionCounts.shares} onClick={onShare} />
      </div>
    </aside>
  );
}

export default VideoActionBox;
