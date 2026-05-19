package com.example.back.service.client;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.back.dto.VideosResponseDTO;
import com.example.back.dto.imagekit.ImageKitUploadResponse;
import com.example.back.entity.UserEntity;
import com.example.back.entity.VideoEntity;
import com.example.back.exception.InvalidTokenException;
import com.example.back.repository.UserRepository;
import com.example.back.repository.VideoRepository;
import com.example.back.service.ImageKitService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VideoService {

  private final VideoRepository videoRepository;
  private final UserRepository userRepository;
  private final ImageKitService imageKitService;

  @Transactional(readOnly = true)
  public List<VideosResponseDTO> getFeed() {
    return videoRepository.findFeed().stream().map(this::toDto).toList();
  }

  @Transactional
  public VideosResponseDTO uploadVideo(long userId, MultipartFile file, String caption) {
    UserEntity user = userRepository.findById(userId).orElseThrow(InvalidTokenException::new);
    ImageKitUploadResponse uploaded = imageKitService.upload(file);

    VideoEntity video = new VideoEntity();
    video.setUser(user);
    video.setCaption(normalize(caption));
    video.setVideoUrl(uploaded.getUrl());
    video.setThumbnailUrl(uploaded.getThumbnailUrl());
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
