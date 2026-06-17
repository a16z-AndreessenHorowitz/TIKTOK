package com.example.back.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "users",
    uniqueConstraints = {
      @UniqueConstraint(name = "uk_users_email", columnNames = "email"),
      @UniqueConstraint(name = "uk_users_username", columnNames = "username"),
    })
@Getter
@Setter
@NoArgsConstructor
public class UserEntity {

  public enum UserRole {
    USER,
    ADMIN
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 100)
  private String username;

  @Column(name = "display_name", length = 80)
  private String displayName;

  /**
   * Stored lowercase only. Unique constraint {@code uk_users_email} is backed by a B-tree
   * index in InnoDB; queries must use {@code WHERE email = ?} (not {@code LOWER(email)}) to use it.
   */
  @Column(nullable = false, length = 255)
  private String email;

  @Column(name = "password_hash", nullable = false, length = 255)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(name = "role", nullable = false, columnDefinition = "ENUM('USER','ADMIN') DEFAULT 'USER'")
  private UserRole role = UserRole.USER;

  @Column(name = "avatar_url", length = 512)
  private String avatarUrl;

  @Column(columnDefinition = "TEXT")
  private String bio;

  @Column(name = "birth_date")
  private LocalDate birthDate;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "follower_count", nullable = false)
  private Long followerCount;

  @Column(name = "following_count", nullable = false)
  private Long followingCount;

  @PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
    if (followerCount == null) {
      followerCount = 0L;
    }
    if (followingCount == null) {
      followingCount = 0L;
    }
    if (role == null) {
      role = UserRole.USER;
    }
    if (displayName == null || displayName.isBlank()) {
      displayName = username;
    }
  }
}
