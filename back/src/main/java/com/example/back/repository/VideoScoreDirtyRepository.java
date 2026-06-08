package com.example.back.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Repository;


import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Repository
public class VideoScoreDirtyRepository {

  @PersistenceContext
  private EntityManager entityManager;

  public void markDirty(long videoId) {
    entityManager
        .createNativeQuery(
            """
            INSERT INTO video_score_dirty (video_id, updated_at)
            VALUES (?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
            """)
        .setParameter(1, videoId)
        .executeUpdate();
  }

  public List<Long> findDirtyVideoIds(LocalDateTime cutoff, int limit) {
    return entityManager
        .createQuery(
            """
            SELECT d.videoId
            FROM VideoScoreDirty d
            WHERE d.updatedAt <= :cutoff
            ORDER BY d.updatedAt ASC
            """,
            Long.class)
        .setParameter("cutoff", cutoff)
        .setMaxResults(limit)
        .getResultList();
  }

  public int deleteProcessedVideoIds(List<Long> videoIds, LocalDateTime cutoff) {
    if (videoIds == null || videoIds.isEmpty()) {
      return 0;
    }

    return entityManager
        .createQuery(
            """
            DELETE FROM VideoScoreDirty d
            WHERE d.videoId IN :videoIds
              AND d.updatedAt <= :cutoff
            """)
        .setParameter("videoIds", videoIds)
        .setParameter("cutoff", cutoff)
        .executeUpdate();
  }
}
