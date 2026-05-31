package com.example.back.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back.dto.FollowStatusDTO;
import com.example.back.entity.UserEntity;
import com.example.back.repository.FollowRepository;
import com.example.back.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FollowService {

  private final FollowRepository followRepository;
  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public FollowStatusDTO getFollowStatus(long followerId, long followingId) {
    UserEntity following = findUser(followingId);
    boolean followed =
        followerId != followingId
            && followRepository.existsByFollowerIdAndFollowingId(followerId, followingId);

    return toStatus(following, followed);
  }

  @Transactional
  public FollowStatusDTO follow(long followerId, long followingId) {
    if (followerId == followingId) {
      throw new IllegalArgumentException("Không thể tự follow chính mình.");
    }

    requireUser(followerId);
    requireUser(followingId);
    int inserted = followRepository.insertIgnore(followerId, followingId);

    if (inserted > 0) {
      userRepository.incrementFollowingCount(followerId);
      userRepository.incrementFollowerCount(followingId);
    }

    return FollowStatusDTO.builder()
        .userId(followingId)
        .followed(true)
        .followerCount(userRepository.getFollowerCount(followingId))
        .followingCount(userRepository.getFollowingCount(followingId))
        .build();
  }

  @Transactional
  public FollowStatusDTO unfollow(long followerId, long followingId) {
    if (followerId == followingId) {
      throw new IllegalArgumentException("Không thể tự hủy follow chính mình.");
    }

    requireUser(followerId);
    requireUser(followingId);
    int deleted = followRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);

    if (deleted > 0) {
      userRepository.decrementFollowingCount(followerId);
      userRepository.decrementFollowerCount(followingId);
    }

    return FollowStatusDTO.builder()
        .userId(followingId)
        .followed(false)
        .followerCount(userRepository.getFollowerCount(followingId))
        .followingCount(userRepository.getFollowingCount(followingId))
        .build();
  }

  private UserEntity findUser(long userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại."));
  }

  private void requireUser(long userId) {
    if (!userRepository.existsById(userId)) {
      throw new IllegalArgumentException("Người dùng không tồn tại.");
    }
  }

  private static FollowStatusDTO toStatus(UserEntity user, boolean followed) {
    return FollowStatusDTO.builder()
        .userId(user.getId())
        .followed(followed)
        .followerCount(defaultLong(user.getFollowerCount()))
        .followingCount(defaultLong(user.getFollowingCount()))
        .build();
  }

  private static long defaultLong(Long value) {
    return value != null ? value : 0L;
  }
}
