package com.example.back.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.back.entity.VideoInteraction.VideoInteractionType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VideoInteractionDTO {

  private Long id;
  private Long userId;
  private Long videoId;
  private VideoInteractionType interactionType;
  private BigDecimal watchTime;
  private BigDecimal completionRate;
  private Boolean isRewatch;
  private LocalDateTime createdAt;
  private LocalDateTime lastWatchedAt;
}
