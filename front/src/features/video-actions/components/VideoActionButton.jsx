import { formatActionCount } from "./videoActionCount";
import "../../../styles/VideoActionButton.css";

function VideoActionButton({
  label,
  iconClassName,
  count,
  onClick,
  active = false,
  showCount = true,
  variant = "default",
}) {
  const className = [
    "VideoActionButton",
    `VideoActionButton--${variant}`,
    active ? "VideoActionButton--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="VideoActionButton__icon" aria-hidden="true">
        <i className={iconClassName} />
      </span>
      <span
        className="VideoActionButton__count"
        style={!showCount ? { visibility: "hidden", minHeight: "5px" } : undefined}
      >
        {showCount ? formatActionCount(count) : ""}
      </span>
    </button>
  );
}

export default VideoActionButton;
