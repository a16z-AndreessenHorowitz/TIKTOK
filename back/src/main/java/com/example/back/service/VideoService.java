package com.example.back.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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

  private final VideoRepository videoRepository;
  private final UserRepository userRepository;
  private final LocalVideoStorageService localVideoStorageService;
  private final VideoMetadataService videoMetadataService;
  private final HashtagService hashtagService;

  @Transactional
  public VideosResponseDTO uploadVideo(long userId, MultipartFile file, String caption) {
    UserEntity user = userRepository.getReference(userId);
    StoredVideo storedVideo = localVideoStorageService.store(file);

    VideoEntity video = new VideoEntity();
    video.setUser(user);
    video.setCaption(normalize(caption));
    video.setVideoUrl(storedVideo.url());
    video.setThumbnailUrl(storedVideo.thumbnailUrl());
    video.setDuration(videoMetadataService.readDurationSeconds(storedVideo.path()));
    video.setPrivacy("public");
    video.setStatus("published");

    video = videoRepository.save(video);
    hashtagService.processHashtags(video.getId(), caption);

    return toDto(video);
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
        .shareCount(defaultLong(video.getShareCount()))
        .duration(video.getDuration())
        .isLiked(false)
        .isFollowed(false)
        .createdAt(video.getCreatedAt())
        .build();
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

}
