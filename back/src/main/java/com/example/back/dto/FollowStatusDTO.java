package com.example.back.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FollowStatusDTO {
  private Long userId;
  private Boolean followed;
  private Long followerCount;
  private Long followingCount;
}
