package com.example.back.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.example.back.entity.VideoEntity;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;

@Repository
public class VideoRepository {

  @PersistenceContext
  private EntityManager entityManager;

  public VideoEntity save(VideoEntity video) {
    entityManager.persist(video);
    entityManager.flush();
    return video;
  }

  public Optional<VideoEntity> findById(long id) {
    return Optional.ofNullable(entityManager.find(VideoEntity.class, id));
  }

  public boolean existsById(long id) {
    List<?> rows =
        entityManager
            .createNativeQuery("SELECT 1 FROM videos WHERE id = ? LIMIT 1")
            .setParameter(1, id)
            .getResultList();
    return !rows.isEmpty();
  }

  public long incrementLikeCount(long videoId) {
    entityManager
        .createNativeQuery(
            "UPDATE videos SET like_count = COALESCE(like_count, 0) + 1 WHERE id = ?")
        .setParameter(1, videoId)
        .executeUpdate();
    return getLongColumn(videoId, "like_count");
  }

  public long decrementLikeCount(long videoId) {
    entityManager
        .createNativeQuery(
            "UPDATE videos SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id = ?")
        .setParameter(1, videoId)
        .executeUpdate();
    return getLongColumn(videoId, "like_count");
  }

  public long incrementCommentCount(long videoId) {
    entityManager
        .createNativeQuery(
            "UPDATE videos SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = ?")
        .setParameter(1, videoId)
        .executeUpdate();
    return getLongColumn(videoId, "comment_count");
  }

  public long getLikeCount(long videoId) {
    return getLongColumn(videoId, "like_count");
  }

  public long getCommentCount(long videoId) {
    return getLongColumn(videoId, "comment_count");
  }

  public List<VideoEntity> findFeed() {
    return entityManager
        .createQuery(
            """
            SELECT v
            FROM VideoEntity v
            JOIN FETCH v.user
            ORDER BY v.createdAt DESC, v.id DESC
            """,
            VideoEntity.class)
        .getResultList();
  }

  public List<VideoEntity> findFeedPage(LocalDateTime cursorCreatedAt, Long cursorId, int limit) {
    String cursorWhere =
        cursorCreatedAt == null || cursorId == null
            ? ""
            : """
              WHERE v.createdAt < :cursorCreatedAt
                 OR (v.createdAt = :cursorCreatedAt AND v.id < :cursorId)
              """;

    TypedQuery<VideoEntity> query =
        entityManager.createQuery(
            """
            SELECT v
            FROM VideoEntity v
            JOIN FETCH v.user
            """
                + cursorWhere
                + """
            ORDER BY v.createdAt DESC, v.id DESC
            """,
            VideoEntity.class);

    if (cursorCreatedAt != null && cursorId != null) {
      query.setParameter("cursorCreatedAt", cursorCreatedAt);
      query.setParameter("cursorId", cursorId);
    }

    return query.setMaxResults(limit).getResultList();
  }

  public List<VideoEntity> findPublishedByUserId(long userId, int limit) {
    return entityManager
        .createQuery(
            """
            SELECT v
            FROM VideoEntity v
            JOIN FETCH v.user
            WHERE v.user.id = :userId
              AND (v.status IS NULL OR v.status = 'published')
              AND (v.privacy IS NULL OR v.privacy = 'public')
            ORDER BY v.createdAt DESC, v.id DESC
            """,
            VideoEntity.class)
        .setParameter("userId", userId)
        .setMaxResults(limit)
        .getResultList();
  }

  public long countPublishedByUserId(long userId) {
    Object value =
        entityManager
            .createQuery(
                """
                SELECT COUNT(v)
                FROM VideoEntity v
                WHERE v.user.id = :userId
                  AND (v.status IS NULL OR v.status = 'published')
                  AND (v.privacy IS NULL OR v.privacy = 'public')
                """,
                Long.class)
            .setParameter("userId", userId)
            .getSingleResult();
    return ((Number) value).longValue();
  }

  public long sumPublishedLikeCountByUserId(long userId) {
    Object value =
        entityManager
            .createQuery(
                """
                SELECT COALESCE(SUM(v.likeCount), 0)
                FROM VideoEntity v
                WHERE v.user.id = :userId
                  AND (v.status IS NULL OR v.status = 'published')
                  AND (v.privacy IS NULL OR v.privacy = 'public')
                """)
            .setParameter("userId", userId)
            .getSingleResult();
    return ((Number) value).longValue();
  }

  private long getLongColumn(long videoId, String columnName) {
    Object value =
        entityManager
            .createNativeQuery("SELECT COALESCE(" + columnName + ", 0) FROM videos WHERE id = ?")
            .setParameter(1, videoId)
            .getSingleResult();
    return ((Number) value).longValue();
  }
}
