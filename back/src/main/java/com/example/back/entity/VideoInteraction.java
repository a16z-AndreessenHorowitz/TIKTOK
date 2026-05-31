package com.example.back.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "video_interactions",
    indexes = {
      @Index(
          name = "idx_video_interactions_user_video_type",
          columnList = "user_id,video_id,interaction_type"),
      @Index(name = "idx_video_interactions_video_created", columnList = "video_id,created_at")
    })
@Getter
@Setter
@NoArgsConstructor
public class VideoInteraction {

  public enum VideoInteractionType {
    VIEW,
    SKIP,
    LIKE,
    COMMENT,
    SHARE
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "user_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_video_interactions_user"))
  private UserEntity user;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "video_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_video_interactions_video"))
  private VideoEntity video;

  @Enumerated(EnumType.STRING)
  @Column(
      name = "interaction_type",
      nullable = false,
      length = 20,
      columnDefinition = "ENUM('VIEW','SKIP','LIKE','COMMENT','SHARE')")
  private VideoInteractionType interactionType;

  @Column(name = "watch_time", columnDefinition = "INT DEFAULT 0")
  private Integer watchTime;

  @Column(
      name = "completion_rate",
      precision = 5,
      scale = 2,
      columnDefinition = "DECIMAL(5,2) DEFAULT 0")
  private BigDecimal completionRate;

  @Column(name = "is_rewatch", columnDefinition = "BOOLEAN DEFAULT FALSE")
  private Boolean isRewatch;

  @Column(
      name = "created_at",
      nullable = false,
      updatable = false,
      columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
  private LocalDateTime createdAt;

  @PrePersist
  void prePersist() {
    if (watchTime == null) {
      watchTime = 0;
    }
    if (completionRate == null) {
      completionRate = BigDecimal.ZERO;
    }
    if (isRewatch == null) {
      isRewatch = false;
    }
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }
}
