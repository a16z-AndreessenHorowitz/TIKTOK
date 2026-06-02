package com.example.back.repository;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.example.back.entity.SavedVideos;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Repository
public class SavedVideoRepository {

  @PersistenceContext
  private EntityManager entityManager;

  public SavedVideos save(SavedVideos savedVideo) {
    entityManager.persist(savedVideo);
    entityManager.flush();
    return savedVideo;
  }

  public int insertIgnore(long userId, long videoId) {
    return entityManager
        .createNativeQuery(
            """
            INSERT IGNORE INTO saved_videos (user_id, video_id, created_at)
            VALUES (?, ?, NOW())
            """)
        .setParameter(1, userId)
        .setParameter(2, videoId)
        .executeUpdate();
  }

  public boolean existsByUserIdAndVideoId(long userId, long videoId) {
    List<?> rows =
        entityManager
            .createNativeQuery(
                """
                SELECT 1
                FROM saved_videos
                WHERE user_id = ? AND video_id = ?
                LIMIT 1
                """)
            .setParameter(1, userId)
            .setParameter(2, videoId)
            .getResultList();
    return !rows.isEmpty();
  }

  public int deleteByUserIdAndVideoId(long userId, long videoId) {
    return entityManager
        .createQuery(
            """
            DELETE FROM SavedVideos s
            WHERE s.user.id = :userId
              AND s.video.id = :videoId
            """)
        .setParameter("userId", userId)
        .setParameter("videoId", videoId)
        .executeUpdate();
  }

  public List<Long> findSavedVideoIds(long userId, List<Long> videoIds) {
    if (videoIds == null || videoIds.isEmpty()) {
      return List.of();
    }

    return entityManager
        .createQuery(
            """
            SELECT s.video.id
            FROM SavedVideos s
            WHERE s.user.id = :userId
              AND s.video.id IN (:videoIds)
            """,
            Long.class)
        .setParameter("userId", userId)
        .setParameter("videoIds", videoIds)
        .getResultList();
  }
}
