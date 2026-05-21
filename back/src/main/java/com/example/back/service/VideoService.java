package com.example.back.service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.back.dto.VideoFeedItemDTO;
import com.example.back.dto.VideoFeedResponseDTO;
import com.example.back.dto.VideosResponseDTO;
import com.example.back.entity.UserEntity;
import com.example.back.entity.VideoEntity;
import com.example.back.repository.UserRepository;
import com.example.back.repository.VideoRepository;
import com.example.back.service.LocalVideoStorageService.StoredVideo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VideoService {

  private static final int DEFAULT_FEED_LIMIT = 8;
  private static final int MAX_FEED_LIMIT = 20;

  private final VideoRepository videoRepository;
  private final UserRepository userRepository;
  private final LocalVideoStorageService localVideoStorageService;

  @Transactional(readOnly = true)
  public VideoFeedResponseDTO getFeed(String cursor, Integer limit) {
    int pageSize = clampLimit(limit);
    FeedCursor feedCursor = parseCursor(cursor);
    List<VideoEntity> videos =
        videoRepository.findFeedPage(feedCursor.createdAt(), feedCursor.id(), pageSize + 1);

    boolean hasNext = videos.size() > pageSize;
    List<VideoEntity> page = hasNext ? videos.subList(0, pageSize) : videos;
    String nextCursor = hasNext && !page.isEmpty() ? encodeCursor(page.get(page.size() - 1)) : null;

    return VideoFeedResponseDTO.builder()
        .items(page.stream().map(this::toFeedItem).toList())
        .nextCursor(nextCursor)
        .build();
  }

  @Transactional
  public VideosResponseDTO uploadVideo(long userId, MultipartFile file, String caption) {
    UserEntity user = userRepository.getReference(userId);
    StoredVideo storedVideo = localVideoStorageService.store(file);

    VideoEntity video = new VideoEntity();
    video.setUser(user);
    video.setCaption(normalize(caption));
    video.setVideoUrl(storedVideo.url());
    video.setThumbnailUrl(storedVideo.thumbnailUrl());
    video.setPrivacy("public");
    video.setStatus("published");

    return toDto(videoRepository.save(video));
  }

  private VideosResponseDTO toDto(VideoEntity video) {
    UserEntity user = video.getUser();
    return VideosResponseDTO.builder()
        .id(video.getId())
        .videoUrl(video.getVideoUrl())
        .thumbnailUrl(video.getThumbnailUrl())
        .caption(video.getCaption())
        .userId(user != null ? user.getId() : null)
        .username(user != null ? user.getUsername() : null)
        .avatarUrl(user != null ? user.getAvatarUrl() : null)
        .viewCount(defaultLong(video.getViewCount()))
        .likeCount(defaultLong(video.getLikeCount()))
        .commentCount(defaultLong(video.getCommentCount()))
        .shareCount(0L)
        .isLiked(false)
        .isFollowed(false)
        .createdAt(video.getCreatedAt())
        .build();
  }

  private VideoFeedItemDTO toFeedItem(VideoEntity video) {
    UserEntity user = video.getUser();
    String username = user != null ? user.getUsername() : null;

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
                .id(user != null ? user.getId() : null)
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
                .shares(0L)
                .build())
        .viewer(
            VideoFeedItemDTO.ViewerInfo.builder()
                .liked(false)
                .followed(false)
                .build())
        .build();
  }

  private static int clampLimit(Integer limit) {
    if (limit == null) {
      return DEFAULT_FEED_LIMIT;
    }
    return Math.max(1, Math.min(limit, MAX_FEED_LIMIT));
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

  private static String encodeCursor(VideoEntity video) {
    if (video.getCreatedAt() == null || video.getId() == null) {
      return null;
    }

    String raw = video.getCreatedAt() + "|" + video.getId();
    return Base64.getUrlEncoder()
        .withoutPadding()
        .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
  }

  private static String normalize(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
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
