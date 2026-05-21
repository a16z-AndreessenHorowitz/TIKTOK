import "./css/VideoActionBox.css";

import { defaultAvatar } from "../lib/userAvatar";

const DEFAULT_ACTION_COUNT = 1;

const ACTIONS = [
  {
    key: "likes",
    label: "Thích",
    iconClassName: "fa-solid fa-heart",
  },
  {
    key: "comments",
    label: "Bình luận",
    iconClassName: "fa-solid fa-comment-dots",
  },
  {
    key: "saves",
    label: "Lưu",
    iconClassName: "fa-solid fa-bookmark",
  },
  {
    key: "shares",
    label: "Chia sẻ",
    iconClassName: "fa-solid fa-share",
  },
];

function getAvatarSrc(avatarUrl) {
  if (typeof avatarUrl === "string" && avatarUrl.trim()) {
    return avatarUrl.trim();
  }
  return defaultAvatar;
}

function formatActionCount(value) {
  if (value == null || value === "") {
    return String(DEFAULT_ACTION_COUNT);
  }

  const count = Number(value);
  if (!Number.isFinite(count)) {
    return String(value);
  }

  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1)}M`;
  }

  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(count >= 10_000 ? 0 : 1)}K`;
  }

  return String(count);
}

function VideoActionBox({ avatarUrl, username, counts = {}, placement = "bottom" }) {
  const avatarSrc = getAvatarSrc(avatarUrl);
  const displayName = username || "người đăng";
  const actionCounts = counts || {};
  const placementClassName = placement === "center" ? " VideoActionBox--center" : "";

  return (
    <aside className={`VideoActionBox${placementClassName}`} aria-label="Tương tác video">
      <button
        type="button"
        className="VideoActionBox__profile"
        aria-label={`Mở hồ sơ ${displayName}`}
      >
        <img className="VideoActionBox__avatar" src={avatarSrc} alt="" />
        <span className="VideoActionBox__follow-badge" aria-hidden="true">
          <i className="fa-solid fa-plus" />
        </span>
      </button>

      <div className="VideoActionBox__list">
        {ACTIONS.map((action) => (
          <button
            key={action.key}
            type="button"
            className="VideoActionBox__action"
            aria-label={action.label}
          >
            <span className="VideoActionBox__icon" aria-hidden="true">
              <i className={action.iconClassName} />
            </span>
            <span className="VideoActionBox__count">
              {formatActionCount(actionCounts[action.key])}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default VideoActionBox;
