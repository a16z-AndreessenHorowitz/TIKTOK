import VideoActionButton from "./VideoActionButton";

function VideoLikeAction({ count, active = false, onClick }) {
  return (
    <VideoActionButton
      label="Thích"
      iconClassName="fa-solid fa-heart"
      count={count}
      active={active}
      onClick={onClick}
      variant="like"
    />
  );
}

export default VideoLikeAction;
