package com.example.back.repository;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.example.back.entity.Likes;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Repository
public class LikeRepository {

  @PersistenceContext
  private EntityManager entityManager;

  public Likes save(Likes like) {
    entityManager.persist(like);
    entityManager.flush();
    return like;
  }

  public int insertIgnore(long userId, long videoId) {
    return entityManager
        .createNativeQuery(
            """
            INSERT IGNORE INTO likes (user_id, video_id, created_at)
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
                FROM likes
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
            DELETE FROM Likes l
            WHERE l.user.id = :userId
              AND l.video.id = :videoId
            """)
        .setParameter("userId", userId)
        .setParameter("videoId", videoId)
        .executeUpdate();
  }

  public List<Long> findLikedVideoIds(long userId, List<Long> videoIds) {
    if (videoIds == null || videoIds.isEmpty()) {
      return List.of();
    }

    return entityManager
        .createQuery(
            """
            SELECT l.video.id
            FROM Likes l
            WHERE l.user.id = :userId
              AND l.video.id IN (:videoIds)
            """,
            Long.class)
        .setParameter("userId", userId)
        .setParameter("videoIds", videoIds)
        .getResultList();
  }
}
