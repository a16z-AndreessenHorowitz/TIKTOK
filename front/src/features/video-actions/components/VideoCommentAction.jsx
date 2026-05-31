import VideoActionButton from "./VideoActionButton";

function VideoCommentAction({ count, onClick, active = false }) {
  return (
    <VideoActionButton
      label="Bình luận"
      iconClassName="fa-solid fa-comment-dots"
      count={count}
      onClick={onClick}
      active={active}
    />
  );
}

export default VideoCommentAction;
