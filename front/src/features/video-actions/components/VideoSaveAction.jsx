import VideoActionButton from "./VideoActionButton";

function VideoSaveAction({ count, active = false, onClick }) {
  return (
    <VideoActionButton
      label="Lưu"
      iconClassName="fa-solid fa-bookmark"
      count={count}
      active={active}
      onClick={onClick}
    />
  );
}

export default VideoSaveAction;
