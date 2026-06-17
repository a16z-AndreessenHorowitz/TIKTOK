package com.example.back.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back.dto.VideoSaveStatusDTO;
import com.example.back.repository.SavedVideoRepository;
import com.example.back.repository.UserRepository;
import com.example.back.repository.VideoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VideoSaveService {

  private final SavedVideoRepository savedVideoRepository;
  private final UserRepository userRepository;
  private final VideoRepository videoRepository;

  @Transactional(readOnly = true)
  public VideoSaveStatusDTO getSaveStatus(long userId, long videoId) {
    requireVideo(videoId);
    boolean saved = savedVideoRepository.existsByUserIdAndVideoId(userId, videoId);
    long saveCount = videoRepository.getSaveCount(videoId);
    return VideoSaveStatusDTO.builder()
        .videoId(videoId)
        .saved(saved)
        .saveCount(saveCount)
        .build();
  }

  @Transactional
  public VideoSaveStatusDTO save(long userId, long videoId) {
    requireUser(userId);
    requireVideo(videoId);

    // INSERT IGNORE tránh duplicate — nếu đã save rồi thì inserted = 0, không increment
    int inserted = savedVideoRepository.insertIgnore(userId, videoId);
    long saveCount =
        inserted > 0
            ? videoRepository.incrementSaveCount(videoId)
            : videoRepository.getSaveCount(videoId);

    return VideoSaveStatusDTO.builder()
        .videoId(videoId)
        .saved(true)
        .saveCount(saveCount)
        .build();
  }

  @Transactional
  public VideoSaveStatusDTO unsave(long userId, long videoId) {
    requireVideo(videoId);

    int deleted = savedVideoRepository.deleteByUserIdAndVideoId(userId, videoId);
    long saveCount =
        deleted > 0
            ? videoRepository.decrementSaveCount(videoId)
            : videoRepository.getSaveCount(videoId);

    return VideoSaveStatusDTO.builder()
        .videoId(videoId)
        .saved(false)
        .saveCount(saveCount)
        .build();
  }

  private void requireUser(long userId) {
    if (!userRepository.existsById(userId)) {
      throw new IllegalArgumentException("Người dùng không tồn tại.");
    }
  }

  private void requireVideo(long videoId) {
    if (!videoRepository.existsById(videoId)) {
      throw new IllegalArgumentException("Video không tồn tại.");
    }
  }
}
