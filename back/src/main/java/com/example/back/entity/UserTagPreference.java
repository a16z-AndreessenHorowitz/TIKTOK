package com.example.back.entity;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "user_tag_preferences",
    indexes = {
      @Index(name = "idx_user_tag_preferences_user_score", columnList = "user_id,score"),
      @Index(name = "idx_user_tag_preferences_tag", columnList = "tag_id")
    })
@Getter
@Setter
@NoArgsConstructor
public class UserTagPreference {

  @EmbeddedId
  private PreferenceId id;

  @MapsId("userId")
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "user_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_user_tag_preferences_user"))
  private UserEntity user;

  @MapsId("tagId")
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "tag_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_user_tag_preferences_tag"))
  private HashtagEntity tag;

  @Column(name = "score", precision = 10, scale = 2, nullable = false)
  private BigDecimal score;

  @Column(name = "last_interacted_at", nullable = false)
  private LocalDateTime lastInteractedAt;

  @PrePersist
  @PreUpdate
  void touch() {
    if (score == null) {
      score = BigDecimal.ZERO;
    }
    lastInteractedAt = LocalDateTime.now();
  }

  @Embeddable
  @Getter
  @Setter
  @NoArgsConstructor
  @EqualsAndHashCode
  public static class PreferenceId implements Serializable {

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "tag_id")
    private Long tagId;
  }
}
