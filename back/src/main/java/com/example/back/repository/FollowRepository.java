package com.example.back.repository;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.example.back.entity.Follows;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Repository
public class FollowRepository {

  @PersistenceContext
  private EntityManager entityManager;

  public Follows save(Follows follow) {
    entityManager.persist(follow);
    entityManager.flush();
    return follow;
  }

  public int insertIgnore(long followerId, long followingId) {
    return entityManager
        .createNativeQuery(
            """
            INSERT IGNORE INTO follows (follower_id, following_id, created_at)
            VALUES (:followerId, :followingId, NOW())
            """)
        .setParameter("followerId", followerId)
        .setParameter("followingId", followingId)
        .executeUpdate();
  }

  public boolean existsByFollowerIdAndFollowingId(long followerId, long followingId) {
    List<?> rows =
        entityManager
            .createNativeQuery(
                """
                SELECT 1
                FROM follows
                WHERE follower_id = :followerId AND following_id = :followingId
                LIMIT 1
                """)
            .setParameter("followerId", followerId)
            .setParameter("followingId", followingId)
            .getResultList();
    return !rows.isEmpty();
  }

  public int deleteByFollowerIdAndFollowingId(long followerId, long followingId) {
    return entityManager
        .createQuery(
            """
            DELETE FROM Follows f
            WHERE f.follower.id = :followerId
              AND f.following.id = :followingId
            """)
        .setParameter("followerId", followerId)
        .setParameter("followingId", followingId)
        .executeUpdate();
  }

  public List<Long> findFollowingIds(long followerId, List<Long> followingIds) {
    if (followingIds == null || followingIds.isEmpty()) {
      return List.of();
    }

    return entityManager
        .createQuery(
            """
            SELECT f.following.id
            FROM Follows f
            WHERE f.follower.id = :followerId
              AND f.following.id IN (:followingIds)
            """,
            Long.class)
        .setParameter("followerId", followerId)
        .setParameter("followingIds", followingIds)
        .getResultList();
  }
}
