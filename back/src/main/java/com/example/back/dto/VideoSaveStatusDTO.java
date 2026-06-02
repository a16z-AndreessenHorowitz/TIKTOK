package com.example.back.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VideoSaveStatusDTO {
  private Long videoId;
  private Boolean saved;
  private Long saveCount;
}
