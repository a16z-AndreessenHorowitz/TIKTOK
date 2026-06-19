package com.example.back.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back.event.VideoCounterEventQueue;
import com.example.back.event.VideoCounterType;
import com.example.back.repository.ShareRepository;
import com.example.back.repository.UserRepository;
import com.example.back.repository.VideoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VideoShareService {

  private final ShareRepository shareRepository;
  private final UserRepository userRepository;
  private final VideoRepository videoRepository;
  private final VideoCounterEventQueue videoCounterEventQueue;

  @Transactional
  public void share(long userId, long videoId) {
    requireUser(userId);
    requireVideo(videoId);

    shareRepository.insert(userId, videoId);
    videoCounterEventQueue.publish(VideoCounterType.SHARE, videoId, 1);
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
