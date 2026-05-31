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
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "follows",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_follows_follower_following",
          columnNames = {"follower_id", "following_id"})
    },
    indexes = {
      @Index(
          name = "idx_follows_follower_following",
          columnList = "follower_id,following_id"),
      @Index(
          name = "idx_follows_following",
          columnList = "following_id")
    })
@Getter
@Setter
@NoArgsConstructor
public class Follows {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "follower_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_follows_follower"))
  private UserEntity follower;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "following_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_follows_following"))
  private UserEntity following;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }
}
