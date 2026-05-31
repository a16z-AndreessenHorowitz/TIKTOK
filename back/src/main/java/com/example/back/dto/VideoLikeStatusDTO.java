package com.example.back.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VideoLikeStatusDTO {
  private Long videoId;
  private Boolean liked;
  private Long likeCount;
}
