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
import com.example.back.repository.UserTagPreferenceRepository;
import com.example.back.repository.UserRepository;
import com.example.back.repository.VideoInteractionRepository;
import com.example.back.repository.VideoRepository;
import com.example.back.repository.VideoScoreDirtyRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VideoInteractionService {

  private static final int SKIP_WATCH_TIME_SECONDS = 2;
  private static final BigDecimal SKIP_COMPLETION_RATE = new BigDecimal("0.15");
  private static final BigDecimal SKIP_TAG_SCORE = new BigDecimal("0.10");
  private static final BigDecimal VIEW_TAG_SCORE = new BigDecimal("1.00");
  private static final BigDecimal REWATCH_TAG_SCORE = new BigDecimal("2.00");

  private final VideoInteractionRepository videoInteractionRepository;
  private final UserTagPreferenceRepository userTagPreferenceRepository;
  private final UserRepository userRepository;
  private final VideoRepository videoRepository;
  private final VideoScoreDirtyRepository videoScoreDirtyRepository;

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

  private VideoInteractionDTO recordViewInternal(long userId, long videoId, BigDecimal rawWatchTime) {
    VideoEntity video = requireVideo(videoId);
    BigDecimal watchTime = normalizeWatchTime(rawWatchTime, video.getDuration());
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
    videoScoreDirtyRepository.markDirty(videoId);
    userTagPreferenceRepository.incrementPreferencesForVideo(
        userId, videoId, tagScoreForView(interactionType, rewatch));

    return toDto(saved);
  }

  private VideoInteraction save(
      long userId,
      VideoEntity video,
      VideoInteractionType interactionType,
      BigDecimal watchTime,
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

  private static BigDecimal normalizeWatchTime(BigDecimal watchTime, Integer duration) {
    BigDecimal normalizedWatchTime =
        watchTime != null ? watchTime.max(BigDecimal.ZERO) : BigDecimal.ZERO;
    if (duration == null || duration <= 0) {
      return normalizedWatchTime.setScale(2, RoundingMode.HALF_UP);
    }
    return normalizedWatchTime
        .min(BigDecimal.valueOf(duration))
        .setScale(2, RoundingMode.HALF_UP);
  }

  private static BigDecimal calculateCompletionRate(BigDecimal watchTime, Integer duration) {
    if (duration == null || duration <= 0 || watchTime.compareTo(BigDecimal.ZERO) <= 0) {
      return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    BigDecimal rate =
        watchTime.divide(BigDecimal.valueOf(duration), 4, RoundingMode.HALF_UP)
            .min(BigDecimal.ONE);
    return rate.setScale(2, RoundingMode.HALF_UP);
  }

  private static final int MIN_VIEW_TIME_SECONDS = 7;

  private static boolean isSkip(BigDecimal watchTime, BigDecimal completionRate, Integer duration) {
    if (watchTime.compareTo(BigDecimal.valueOf(MIN_VIEW_TIME_SECONDS)) >= 0) {
      return false;
    }
    return watchTime.compareTo(BigDecimal.valueOf(SKIP_WATCH_TIME_SECONDS)) < 0
        || (duration != null
            && duration > 0
            && completionRate.compareTo(SKIP_COMPLETION_RATE) < 0);
  }

  private static BigDecimal tagScoreForView(VideoInteractionType interactionType, boolean rewatch) {
    if (interactionType == VideoInteractionType.SKIP) {
      return SKIP_TAG_SCORE;
    }
    return rewatch ? REWATCH_TAG_SCORE : VIEW_TAG_SCORE;
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
        .lastWatchedAt(interaction.getLastWatchedAt())
        .build();
  }
}
