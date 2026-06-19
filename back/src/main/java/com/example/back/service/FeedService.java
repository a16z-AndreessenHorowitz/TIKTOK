package com.example.back.service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back.dto.VideoFeedItemDTO;
import com.example.back.dto.VideoFeedResponseDTO;
import com.example.back.entity.UserEntity;
import com.example.back.entity.VideoEntity;
import com.example.back.repository.FollowRepository;
import com.example.back.repository.LikeRepository;
import com.example.back.repository.SavedVideoRepository;
import com.example.back.repository.VideoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FeedService {

  private static final int DEFAULT_FEED_LIMIT = 8;
  private static final int MAX_FEED_LIMIT = 20;
  private static final int MAX_EXCLUDED_VIDEO_IDS = 200;

  private final VideoRepository videoRepository;
  private final FollowRepository followRepository;
  private final LikeRepository likeRepository;
  private final SavedVideoRepository savedVideoRepository;

  @Transactional(readOnly = true)
  public VideoFeedResponseDTO getFeed(
      String cursor, Integer limit, Long viewerUserId, String rawExcludedVideoIds) {
    int pageSize = clampLimit(limit);
    FeedCursor feedCursor = parseCursor(cursor);
    List<Long> excludedVideoIds = parseExcludedVideoIds(rawExcludedVideoIds);
    List<VideoEntity> candidates =
        videoRepository.findFeedPage(
            viewerUserId,
            excludedVideoIds,
            feedCursor.createdAt(),
            feedCursor.id(),
            pageSize + 1,
            true);

    if (candidates.isEmpty() && viewerUserId != null) {
      candidates =
          videoRepository.findFeedPage(
              null,
              excludedVideoIds,
              feedCursor.createdAt(),
              feedCursor.id(),
              pageSize + 1,
              false);
    }

    boolean hasMore = candidates.size() > pageSize;
    List<VideoEntity> page = hasMore ? candidates.subList(0, pageSize) : candidates;
    VideoEntity cursorVideo = !page.isEmpty() ? page.get(page.size() - 1) : null;

    Set<Long> followedAuthorIds = findFollowedAuthorIds(viewerUserId, page);
    Set<Long> likedVideoIds = findLikedVideoIds(viewerUserId, page);
    Set<Long> savedVideoIds = findSavedVideoIds(viewerUserId, page);

    return VideoFeedResponseDTO.builder()
        .items(
            page.stream()
                .map(video -> toFeedItem(video, viewerUserId, followedAuthorIds, likedVideoIds, savedVideoIds))
                .toList())
        .nextCursor(hasMore ? encodeCursor(cursorVideo) : null)
        .build();
  }

  private VideoFeedItemDTO toFeedItem(
      VideoEntity video,
      Long viewerUserId,
      Set<Long> followedAuthorIds,
      Set<Long> likedVideoIds,
      Set<Long> savedVideoIds) {
    UserEntity user = video.getUser();
    String username = user != null ? user.getUsername() : null;
    Long authorId = user != null ? user.getId() : null;
    boolean followed =
        authorId != null
            && viewerUserId != null
            && !Objects.equals(authorId, viewerUserId)
            && followedAuthorIds.contains(authorId);

    return VideoFeedItemDTO.builder()
        .id(video.getId())
        .caption(video.getCaption())
        .createdAt(video.getCreatedAt())
        .video(
            VideoFeedItemDTO.VideoInfo.builder()
                .playUrl(video.getVideoUrl())
                .thumbnailUrl(video.getThumbnailUrl())
                .duration(video.getDuration())
                .build())
        .author(
            VideoFeedItemDTO.AuthorInfo.builder()
                .id(authorId)
                .name(username)
                .username(username)
                .avatar(user != null ? user.getAvatarUrl() : null)
                .build())
        .music(
            VideoFeedItemDTO.MusicInfo.builder()
                .title(username != null ? "Âm thanh gốc - " + username : "Âm thanh gốc")
                .build())
        .stats(
            VideoFeedItemDTO.StatsInfo.builder()
                .views(defaultLong(video.getViewCount()))
                .likes(defaultLong(video.getLikeCount()))
                .comments(defaultLong(video.getCommentCount()))
                .shares(defaultLong(video.getShareCount()))
                .saves(defaultLong(video.getSaveCount()))
                .build())
        .viewer(
            VideoFeedItemDTO.ViewerInfo.builder()
                .liked(likedVideoIds.contains(video.getId()))
                .followed(followed)
                .saved(savedVideoIds.contains(video.getId()))
                .build())
        .build();
  }

  private Set<Long> findFollowedAuthorIds(Long viewerUserId, List<VideoEntity> videos) {
    if (viewerUserId == null || videos == null || videos.isEmpty()) {
      return Set.of();
    }

    List<Long> authorIds =
        videos.stream()
            .map(VideoEntity::getUser)
            .filter(Objects::nonNull)
            .map(UserEntity::getId)
            .filter(Objects::nonNull)
            .filter(authorId -> !Objects.equals(authorId, viewerUserId))
            .distinct()
            .toList();

    if (authorIds.isEmpty()) {
      return Set.of();
    }

    return new HashSet<>(followRepository.findFollowingIds(viewerUserId, authorIds));
  }

  private Set<Long> findLikedVideoIds(Long viewerUserId, List<VideoEntity> videos) {
    if (viewerUserId == null || videos == null || videos.isEmpty()) {
      return Set.of();
    }

    List<Long> videoIds =
        videos.stream().map(VideoEntity::getId).filter(Objects::nonNull).distinct().toList();

    if (videoIds.isEmpty()) {
      return Set.of();
    }

    return new HashSet<>(likeRepository.findLikedVideoIds(viewerUserId, videoIds));
  }

  private Set<Long> findSavedVideoIds(Long viewerUserId, List<VideoEntity> videos) {
    if (viewerUserId == null || videos == null || videos.isEmpty()) {
      return Set.of();
    }

    List<Long> videoIds =
        videos.stream().map(VideoEntity::getId).filter(Objects::nonNull).distinct().toList();

    if (videoIds.isEmpty()) {
      return Set.of();
    }

    return new HashSet<>(savedVideoRepository.findSavedVideoIds(viewerUserId, videoIds));
  }

  private static int clampLimit(Integer limit) {
    if (limit == null) {
      return DEFAULT_FEED_LIMIT;
    }
    return Math.max(1, Math.min(limit, MAX_FEED_LIMIT));
  }

  private static List<Long> parseExcludedVideoIds(String rawExcludedVideoIds) {
    if (rawExcludedVideoIds == null || rawExcludedVideoIds.isBlank()) {
      return List.of();
    }

    return java.util.Arrays.stream(rawExcludedVideoIds.split(","))
        .map(String::trim)
        .filter(value -> !value.isEmpty())
        .map(
            value -> {
              try {
                return Long.parseLong(value);
              } catch (NumberFormatException ex) {
                return null;
              }
            })
        .filter(Objects::nonNull)
        .distinct()
        .limit(MAX_EXCLUDED_VIDEO_IDS)
        .toList();
  }

  private static FeedCursor parseCursor(String cursor) {
    if (cursor == null || cursor.isBlank()) {
      return FeedCursor.empty();
    }

    try {
      String decoded =
          new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
      String[] parts = decoded.split("\\|", 2);
      if (parts.length != 2) {
        throw new IllegalArgumentException("Cursor không hợp lệ.");
      }
      return new FeedCursor(LocalDateTime.parse(parts[0]), Long.parseLong(parts[1]));
    } catch (RuntimeException ex) {
      throw new IllegalArgumentException("Cursor không hợp lệ.");
    }
  }

  private String encodeCursor(VideoEntity video) {
    if (video == null || video.getCreatedAt() == null || video.getId() == null) {
      return null;
    }

    String raw = video.getCreatedAt() + "|" + video.getId();
    return Base64.getUrlEncoder()
        .withoutPadding()
        .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
  }

  private static long defaultLong(Long value) {
    return value != null ? value : 0L;
  }

  private record FeedCursor(LocalDateTime createdAt, Long id) {
    private static FeedCursor empty() {
      return new FeedCursor(null, null);
    }
  }
}
