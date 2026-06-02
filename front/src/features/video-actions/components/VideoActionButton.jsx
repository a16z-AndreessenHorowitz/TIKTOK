import { formatActionCount } from "./videoActionCount";

function VideoActionButton({ label, iconClassName, count, onClick, active = false, showCount = true }) {
  const activeClassName = active ? " VideoActionBox__action--active" : "";

  return (
    <button
      type="button"
      className={`VideoActionBox__action${activeClassName}`}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="VideoActionBox__icon" aria-hidden="true">
        <i className={iconClassName} />
      </span>
      <span
        className="VideoActionBox__count"
        style={!showCount ? { visibility: "hidden", minHeight: "5px" } : undefined}
      >
        {showCount ? formatActionCount(count) : ""}
      </span>
    </button>
  );
}

export default VideoActionButton;
