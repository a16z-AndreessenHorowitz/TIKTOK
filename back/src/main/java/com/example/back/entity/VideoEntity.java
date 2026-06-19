package com.example.back.entity;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "videos",
    indexes = {
      @Index(name = "idx_videos_created_id", columnList = "created_at,id"),
      @Index(
          name = "idx_videos_user_status_privacy_created_id",
          columnList = "user_id,status,privacy,created_at,id")
    })
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

  @Column(name = "save_count")
  private Long saveCount;

  @Column(name = "share_count")
  private Long shareCount;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @ManyToMany
  @JoinTable(
      name = "video_hashtags",
      joinColumns = @JoinColumn(name = "video_id"),
      inverseJoinColumns = @JoinColumn(name = "tag_id"),
      indexes = {
          @Index(name = "idx_tag_id", columnList = "tag_id")
      }
  )
  private Set<HashtagEntity> hashtags = new HashSet<>();

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
    if (saveCount == null) {
      saveCount = 0L;
    }
    if (shareCount == null) {
      shareCount = 0L;
    }
  }
}
