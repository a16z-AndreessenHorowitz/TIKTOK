package com.example.back.entity;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(
    name = "hashtags",
    indexes = {
        @Index(name = "idx_hashtag_name", columnList = "name", unique = true)
    }
)
@Getter
@Setter
@NoArgsConstructor
public class HashtagEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(name = "video_count")
  private Integer videoCount;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @JsonIgnore
  @ManyToMany(mappedBy = "hashtags")
  private Set<VideoEntity> videos = new HashSet<>();

  @PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
    if (videoCount == null) {
      videoCount = 0;
    }
  }
}
