package com.example.back.repository;

import java.math.BigDecimal;

import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Repository
public class UserTagPreferenceRepository {

  @PersistenceContext
  private EntityManager entityManager;

  public int incrementPreferencesForVideo(long userId, long videoId, BigDecimal scoreDelta) {
    if (scoreDelta == null || scoreDelta.signum() <= 0) {
      return 0;
    }

    return entityManager
        .createNativeQuery(
            """
            INSERT INTO user_tag_preferences (user_id, tag_id, score, last_interacted_at)
            SELECT ?, vh.tag_id, ?, CURRENT_TIMESTAMP
            FROM video_hashtags vh
            WHERE vh.video_id = ?
            ON DUPLICATE KEY UPDATE
              score = score + VALUES(score),
              last_interacted_at = CURRENT_TIMESTAMP
            """)
        .setParameter(1, userId)
        .setParameter(2, scoreDelta)
        .setParameter(3, videoId)
        .executeUpdate();
  }
}
