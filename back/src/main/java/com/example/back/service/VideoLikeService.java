package com.example.back.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back.dto.VideoLikeStatusDTO;
import com.example.back.entity.VideoEntity;
import com.example.back.repository.LikeRepository;
import com.example.back.repository.UserRepository;
import com.example.back.repository.VideoRepository;
import com.example.back.repository.VideoScoreDirtyRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VideoLikeService {

  private final LikeRepository likeRepository;
  private final UserRepository userRepository;
  private final VideoRepository videoRepository;
  private final VideoScoreDirtyRepository videoScoreDirtyRepository;

  @Transactional(readOnly = true)
  public VideoLikeStatusDTO getLikeStatus(long userId, long videoId) {
    VideoEntity video = findVideo(videoId);
    boolean liked = likeRepository.existsByUserIdAndVideoId(userId, videoId);
    return toStatus(video, liked);
  }

  @Transactional
  public VideoLikeStatusDTO like(long userId, long videoId) {
    requireUser(userId);
    requireVideo(videoId);

    int inserted = likeRepository.insertIgnore(userId, videoId);
    long likeCount =
        inserted > 0 ? videoRepository.incrementLikeCount(videoId) : videoRepository.getLikeCount(videoId);
    if (inserted > 0) {
      videoScoreDirtyRepository.markDirty(videoId);
    }

    return VideoLikeStatusDTO.builder()
        .videoId(videoId)
        .liked(true)
        .likeCount(likeCount)
        .build();
  }

  @Transactional
  public VideoLikeStatusDTO unlike(long userId, long videoId) {
    requireVideo(videoId);
    int deleted = likeRepository.deleteByUserIdAndVideoId(userId, videoId);
    long likeCount =
        deleted > 0 ? videoRepository.decrementLikeCount(videoId) : videoRepository.getLikeCount(videoId);
    if (deleted > 0) {
      videoScoreDirtyRepository.markDirty(videoId);
    }

    return VideoLikeStatusDTO.builder()
        .videoId(videoId)
        .liked(false)
        .likeCount(likeCount)
        .build();
  }

  private void requireUser(long userId) {
    if (!userRepository.existsById(userId)) {
      throw new IllegalArgumentException("Người dùng không tồn tại.");
    }
  }

  private VideoEntity findVideo(long videoId) {
    return videoRepository
        .findById(videoId)
        .orElseThrow(() -> new IllegalArgumentException("Video không tồn tại."));
  }

  private void requireVideo(long videoId) {
    if (!videoRepository.existsById(videoId)) {
      throw new IllegalArgumentException("Video không tồn tại.");
    }
  }

  private static VideoLikeStatusDTO toStatus(VideoEntity video, boolean liked) {
    return VideoLikeStatusDTO.builder()
        .videoId(video.getId())
        .liked(liked)
        .likeCount(defaultLong(video.getLikeCount()))
        .build();
  }

  private static long defaultLong(Long value) {
    return value != null ? value : 0L;
  }
}
