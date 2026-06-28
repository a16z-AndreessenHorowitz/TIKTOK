import VideoActionButton from "./VideoActionButton";

function VideoShareAction({ count, onClick }) {
  return (
    <VideoActionButton
      label="Chia sẻ"
      iconClassName="fa-solid fa-share"
      count={count}
      onClick={onClick}
      variant="share"
    />
  );
}

export default VideoShareAction;
