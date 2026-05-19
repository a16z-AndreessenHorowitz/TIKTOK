package com.example.back.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "videos")
@Getter
@Setter
@NoArgsConstructor
public class VideoEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_videos_user"))
  private UserEntity user;

  @Column(columnDefinition = "TEXT")
  private String caption;

  @Column(name = "video_url", nullable = false, length = 500)
  private String videoUrl;

  @Column(name = "thumbnail_url", length = 500)
  private String thumbnailUrl;

  @Column
  private Integer duration;
  @Column(length = 20)

  private String privacy;
  @Column(length = 20)

  private String status;
  @Column(name = "view_count")
  private Long viewCount;

  @Column(name = "like_count")
  private Long likeCount;

  @Column(name = "comment_count")
  private Long commentCount;
  
  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
    if (viewCount == null) {
      viewCount = 0L;
    }
    if (likeCount == null) {
      likeCount = 0L;
    }
    if (commentCount == null) {
      commentCount = 0L;
    }
  }
}