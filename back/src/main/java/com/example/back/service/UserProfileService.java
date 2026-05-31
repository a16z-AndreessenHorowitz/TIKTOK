package com.example.back.service;

import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.back.dto.UserProfileDTO;
import com.example.back.dto.VideosResponseDTO;
import com.example.back.entity.UserEntity;
import com.example.back.entity.VideoEntity;
import com.example.back.repository.FollowRepository;
import com.example.back.repository.UserRepository;
import com.example.back.repository.VideoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserProfileService {

  private static final int DEFAULT_PROFILE_VIDEO_LIMIT = 48;
  private static final int MAX_PROFILE_VIDEO_LIMIT = 60;
  private static final int MAX_USERNAME_LENGTH = 30;
  private static final int MAX_DISPLAY_NAME_LENGTH = 80;
  private static final int MAX_BIO_LENGTH = 80;
  private static final Pattern USERNAME_PATTERN = Pattern.compile("^[A-Za-z0-9_.]+$");

  private final UserRepository userRepository;
  private final VideoRepository videoRepository;
  private final FollowRepository followRepository;
  private final LocalAvatarStorageService localAvatarStorageService;

  @Transactional(readOnly = true)
  public UserProfileDTO getProfile(String username, Long viewerUserId, Integer limit) {
    String normalizedUsername = normalizeUsername(username);
    UserEntity user =
        userRepository
            .findByUsername(normalizedUsername)
            .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại."));

    long userId = user.getId();
    boolean self = viewerUserId != null && Objects.equals(viewerUserId, userId);
    boolean followed =
        viewerUserId != null
            && !self
            && followRepository.existsByFollowerIdAndFollowingId(viewerUserId, userId);

    List<VideoEntity> videos =
        videoRepository.findPublishedByUserId(userId, normalizeLimit(limit));

    return UserProfileDTO.builder()
        .id(userId)
        .username(user.getUsername())
        .displayName(user.getDisplayName() != null ? user.getDisplayName() : user.getUsername())
        .avatarUrl(user.getAvatarUrl())
        .bio(user.getBio())
        .followerCount(defaultLong(user.getFollowerCount()))
        .followingCount(defaultLong(user.getFollowingCount()))
        .likeCount(videoRepository.sumPublishedLikeCountByUserId(userId))
        .videoCount(videoRepository.countPublishedByUserId(userId))
        .self(self)
        .followed(followed)
        .videos(videos.stream().map(this::toVideoDto).toList())
        .build();
  }

  @Transactional
  public UserProfileDTO updateProfile(
      long userId, String username, String displayName, String bio, MultipartFile avatar) {
    String nextUsername = normalizeUsername(username);
    UserEntity user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại."));

    if (!user.getUsername().equals(nextUsername)) {
      userRepository
          .findByUsername(nextUsername)
          .filter(existingUser -> !Objects.equals(existingUser.getId(), userId))
          .ifPresent(
              ignored -> {
                throw new IllegalArgumentException("TikTok ID đã được sử dụng.");
              });
    }

    String nextDisplayName = normalizeDisplayName(displayName, nextUsername);
    String nextBio = normalizeNullable(bio);
    String nextAvatarUrl = null;
    if (avatar != null && !avatar.isEmpty()) {
      nextAvatarUrl = localAvatarStorageService.store(avatar);
    }

    int updatedRows =
        userRepository.updateProfile(
            userId, nextUsername, nextDisplayName, nextBio, nextAvatarUrl);
    if (updatedRows == 0) {
      throw new IllegalArgumentException("Không cập nhật được hồ sơ.");
    }

    return getProfile(nextUsername, userId, DEFAULT_PROFILE_VIDEO_LIMIT);
  }

  private VideosResponseDTO toVideoDto(VideoEntity video) {
    return VideosResponseDTO.builder()
        .id(video.getId())
        .videoUrl(video.getVideoUrl())
        .thumbnailUrl(video.getThumbnailUrl())
        .caption(video.getCaption())
        .userId(video.getUser() != null ? video.getUser().getId() : null)
        .username(video.getUser() != null ? video.getUser().getUsername() : null)
        .avatarUrl(video.getUser() != null ? video.getUser().getAvatarUrl() : null)
        .viewCount(defaultLong(video.getViewCount()))
        .likeCount(defaultLong(video.getLikeCount()))
        .commentCount(defaultLong(video.getCommentCount()))
        .shareCount(0L)
        .duration(video.getDuration())
        .isLiked(false)
        .isFollowed(false)
        .createdAt(video.getCreatedAt())
        .build();
  }

  private static String normalizeUsername(String username) {
    String value = username == null ? "" : username.trim();
    if (value.startsWith("@")) {
      value = value.substring(1);
    }
    if (value.isBlank()) {
      throw new IllegalArgumentException("Tên người dùng không hợp lệ.");
    }
    if (value.length() > MAX_USERNAME_LENGTH || !USERNAME_PATTERN.matcher(value).matches()) {
      throw new IllegalArgumentException(
          "TikTok ID chỉ có thể gồm chữ cái, chữ số, dấu gạch dưới và dấu chấm.");
    }
    return value;
  }

  private static String normalizeNullable(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    String normalized = value.trim();
    if (normalized.length() > MAX_BIO_LENGTH) {
      throw new IllegalArgumentException("Tiểu sử chỉ được tối đa 80 ký tự.");
    }
    return normalized;
  }

  private static String normalizeDisplayName(String displayName, String fallbackUsername) {
    if (displayName == null || displayName.isBlank()) {
      return fallbackUsername;
    }
    String normalized = displayName.trim();
    if (normalized.length() > MAX_DISPLAY_NAME_LENGTH) {
      throw new IllegalArgumentException("Tên chỉ được tối đa 80 ký tự.");
    }
    return normalized;
  }

  private static int normalizeLimit(Integer limit) {
    if (limit == null || limit <= 0) {
      return DEFAULT_PROFILE_VIDEO_LIMIT;
    }
    return Math.min(limit, MAX_PROFILE_VIDEO_LIMIT);
  }

  private static long defaultLong(Long value) {
    return value != null ? value : 0L;
  }
}
