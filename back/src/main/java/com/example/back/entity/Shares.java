package com.example.back.entity;

import java.time.LocalDateTime;

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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "shares",
    indexes = {
      @Index(name = "idx_shares_user_created", columnList = "user_id,created_at"),
      @Index(name = "idx_shares_video_created", columnList = "video_id,created_at"),
      @Index(name = "idx_shares_user_video_created", columnList = "user_id,video_id,created_at"),
      @Index(name = "idx_shares_recipient_created", columnList = "recipient_user_id,created_at")
    })
@Getter
@Setter
@NoArgsConstructor
public class Shares {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_shares_user"))
  private UserEntity user;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "video_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_shares_video"))
  private VideoEntity video;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "recipient_user_id", foreignKey = @ForeignKey(name = "fk_shares_recipient_user"))
  private UserEntity recipientUser;

  @Column(name = "share_channel", length = 50)
  private String shareChannel;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }
}
