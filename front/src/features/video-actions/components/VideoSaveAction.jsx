import VideoActionButton from "./VideoActionButton";

function VideoSaveAction({ count, onClick }) {
  return (
    <VideoActionButton
      label="Lưu"
      iconClassName="fa-solid fa-bookmark"
      count={count}
      onClick={onClick}
    />
  );
}

export default VideoSaveAction;
