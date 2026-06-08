package com.example.back.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back.repository.ShareRepository;
import com.example.back.repository.UserRepository;
import com.example.back.repository.VideoRepository;
import com.example.back.repository.VideoScoreDirtyRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VideoShareService {

  private final ShareRepository shareRepository;
  private final UserRepository userRepository;
  private final VideoRepository videoRepository;
  private final VideoScoreDirtyRepository videoScoreDirtyRepository;

  @Transactional
  public void share(long userId, long videoId) {
    requireUser(userId);
    requireVideo(videoId);

    shareRepository.insert(userId, videoId);
    videoScoreDirtyRepository.markDirty(videoId);
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
