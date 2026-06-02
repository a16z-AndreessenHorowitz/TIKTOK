package com.example.back.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back.dto.RecordVideoViewBatchRequest;
import com.example.back.dto.RecordVideoViewRequest;
import com.example.back.dto.VideoInteractionDTO;
import com.example.back.entity.UserEntity;
import com.example.back.entity.VideoEntity;
import com.example.back.entity.VideoInteraction;
import com.example.back.entity.VideoInteraction.VideoInteractionType;
import com.example.back.repository.UserRepository;
import com.example.back.repository.VideoInteractionRepository;
import com.example.back.repository.VideoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VideoInteractionService {

  private static final int SKIP_WATCH_TIME_SECONDS = 2;
  private static final BigDecimal SKIP_COMPLETION_RATE = new BigDecimal("0.15");

  private final VideoInteractionRepository videoInteractionRepository;
  private final UserRepository userRepository;
  private final VideoRepository videoRepository;

  @Transactional
  public VideoInteractionDTO recordView(long userId, long videoId, RecordVideoViewRequest request) {
    return recordViewInternal(userId, videoId, request != null ? request.getWatchTime() : null);
  }

  @Transactional
  public List<VideoInteractionDTO> recordViewBatch(
      long userId, RecordVideoViewBatchRequest request) {
    if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
      return List.of();
    }

    requireUser(userId);
    return request.getItems().stream()
        .map(item -> recordViewInternal(userId, item.getVideoId(), item.getWatchTime()))
        .toList();
  }

  private VideoInteractionDTO recordViewInternal(long userId, long videoId, Integer rawWatchTime) {
    VideoEntity video = requireVideo(videoId);
    int watchTime = normalizeWatchTime(rawWatchTime);
    BigDecimal completionRate = calculateCompletionRate(watchTime, video.getDuration());
    VideoInteractionType interactionType =
        isSkip(watchTime, completionRate, video.getDuration())
            ? VideoInteractionType.SKIP
            : VideoInteractionType.VIEW;
    boolean rewatch =
        videoInteractionRepository.countByUserIdAndVideoIdAndInteractionType(
                userId, videoId, VideoInteractionType.VIEW)
            > 0;

    VideoInteraction saved = save(userId, video, interactionType, watchTime, completionRate, rewatch);

    if (interactionType == VideoInteractionType.VIEW && !rewatch) {
      video.setViewCount((video.getViewCount() == null ? 0 : video.getViewCount()) + 1);
      videoRepository.save(video);
    }

    return toDto(saved);
  }

  @Transactional
  public VideoInteractionDTO recordAction(
      long userId, long videoId, VideoInteractionType interactionType) {
    if (interactionType == VideoInteractionType.VIEW || interactionType == VideoInteractionType.SKIP) {
      throw new IllegalArgumentException("VIEW/SKIP cần gửi watchTime.");
    }

    VideoEntity video = requireVideo(videoId);
    return toDto(save(userId, video, interactionType, 0, BigDecimal.ZERO, false));
  }

  private VideoInteraction save(
      long userId,
      VideoEntity video,
      VideoInteractionType interactionType,
      int watchTime,
      BigDecimal completionRate,
      boolean rewatch) {
    requireUser(userId);
    UserEntity user = userRepository.getReference(userId);

    VideoInteraction interaction = new VideoInteraction();
    interaction.setUser(user);
    interaction.setVideo(video);
    interaction.setInteractionType(interactionType);
    interaction.setWatchTime(watchTime);
    interaction.setCompletionRate(completionRate);
    interaction.setIsRewatch(rewatch);
    return videoInteractionRepository.save(interaction);
  }

  private VideoEntity requireVideo(long videoId) {
    return videoRepository
        .findById(videoId)
        .orElseThrow(() -> new IllegalArgumentException("Video không tồn tại."));
  }

  private void requireUser(long userId) {
    if (!userRepository.existsById(userId)) {
      throw new IllegalArgumentException("Người dùng không tồn tại.");
    }
  }

  private static int normalizeWatchTime(Integer watchTime) {
    return watchTime != null ? Math.max(watchTime, 0) : 0;
  }

  private static BigDecimal calculateCompletionRate(int watchTime, Integer duration) {
    if (duration == null || duration <= 0 || watchTime <= 0) {
      return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    BigDecimal rate =
        BigDecimal.valueOf(watchTime)
            .divide(BigDecimal.valueOf(duration), 4, RoundingMode.HALF_UP)
            .min(BigDecimal.ONE);
    return rate.setScale(2, RoundingMode.HALF_UP);
  }

  private static boolean isSkip(int watchTime, BigDecimal completionRate, Integer duration) {
    return watchTime < SKIP_WATCH_TIME_SECONDS
        || (duration != null
            && duration > 0
            && completionRate.compareTo(SKIP_COMPLETION_RATE) < 0);
  }

  private static VideoInteractionDTO toDto(VideoInteraction interaction) {
    UserEntity user = interaction.getUser();
    VideoEntity video = interaction.getVideo();

    return VideoInteractionDTO.builder()
        .id(interaction.getId())
        .userId(user != null ? user.getId() : null)
        .videoId(video != null ? video.getId() : null)
        .interactionType(interaction.getInteractionType())
        .watchTime(interaction.getWatchTime())
        .completionRate(interaction.getCompletionRate())
        .isRewatch(interaction.getIsRewatch())
        .createdAt(interaction.getCreatedAt())
        .build();
  }
}
