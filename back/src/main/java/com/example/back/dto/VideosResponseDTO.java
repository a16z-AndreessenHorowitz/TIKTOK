package com.example.back.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideosResponseDTO {

  private Long id;
  private String videoUrl;
  private String thumbnailUrl;
  private String caption;

  private Long userId;
  private String username;
  private String avatarUrl;

  private Long viewCount;
  private Long likeCount;
  private Long commentCount;
  private Long shareCount;
  private Integer duration;

  private Boolean isLiked;
  private Boolean isFollowed;

  private LocalDateTime createdAt;
}
