package com.example.back.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "comments",
    indexes = {
      @Index(name = "idx_video_parent_created", columnList = "video_id,parent_comment_id,created_at"),
      @Index(name = "idx_parent_created", columnList = "parent_comment_id,created_at")
    })
@Getter
@Setter
@NoArgsConstructor
public class Comments {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "video_id", nullable = false, foreignKey = @ForeignKey(name = "fk_comments_video"))
  private VideoEntity video;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_comments_user"))
  private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id", foreignKey = @ForeignKey(name = "fk_comments_parent"))
    private Comments parentComment;

    @OneToMany(mappedBy = "parentComment")
    private List<Comments> replies = new ArrayList<>();

  @Column(columnDefinition = "TEXT", nullable = false)
  private String content;

  @Column(name = "like_count")
  private Integer likeCount = 0;

  @Column(name = "reply_count")
  private Integer replyCount = 0;

  @Column(name = "is_deleted")
  private Boolean isDeleted = false;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @PrePersist
  void prePersist() {
    LocalDateTime now = LocalDateTime.now();

    if (createdAt == null) {
      createdAt = now;
    }
    if (updatedAt == null) {
      updatedAt = now;
    }
    if (likeCount == null) {
      likeCount = 0;
    }
    if (replyCount == null) {
      replyCount = 0;
    }
    if (isDeleted == null) {
      isDeleted = false;
    }
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = LocalDateTime.now();
  }
}
