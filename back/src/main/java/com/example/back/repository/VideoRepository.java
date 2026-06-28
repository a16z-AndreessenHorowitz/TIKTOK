package com.example.back.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.example.back.event.VideoCounterType;
import com.example.back.entity.VideoEntity;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

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

  public long incrementCommentCount(long videoId) {
    entityManager
        .createNativeQuery(
            "UPDATE videos SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = ?")
        .setParameter(1, videoId)
        .executeUpdate();
    return getLongColumn(videoId, "comment_count");
  }

  public long incrementSaveCount(long videoId) {
    entityManager
        .createNativeQuery(
            "UPDATE videos SET save_count = COALESCE(save_count, 0) + 1 WHERE id = ?")
        .setParameter(1, videoId)
        .executeUpdate();
    return getLongColumn(videoId, "save_count");
  }

  public long decrementSaveCount(long videoId) {
    entityManager
        .createNativeQuery(
            "UPDATE videos SET save_count = GREATEST(COALESCE(save_count, 0) - 1, 0) WHERE id = ?")
        .setParameter(1, videoId)
        .executeUpdate();
    return getLongColumn(videoId, "save_count");
  }

  public long getLikeCount(long videoId) {
    return getLongColumn(videoId, "like_count");
  }

  public long getSaveCount(long videoId) {
    return getLongColumn(videoId, "save_count");
  }

  public long getCommentCount(long videoId) {
    return getLongColumn(videoId, "comment_count");
  }

  public long getShareCount(long videoId) {
    return getLongColumn(videoId, "share_count");
  }

  public void applyCounterDelta(VideoCounterType type, long videoId, long delta) {
    if (delta == 0L) {
      return;
    }

    String columnName = counterColumnName(type);
    entityManager
        .createNativeQuery(
            "UPDATE videos SET "
                + columnName
                + " = GREATEST(COALESCE("
                + columnName
                + ", 0) + ?, 0) WHERE id = ?")
        .setParameter(1, delta)
        .setParameter(2, videoId)
        .executeUpdate();
  }

  public List<VideoEntity> findRandomFeedPage(
      Long viewerUserId,
      List<Long> excludedVideoIds,
      int limit,
      boolean excludeViewedVideos) {
    List<String> predicates = new ArrayList<>();
    predicates.add("(v.status IS NULL OR v.status = 'published')");
    predicates.add("(v.privacy IS NULL OR v.privacy = 'public')");
    if (excludedVideoIds != null && !excludedVideoIds.isEmpty()) {
      predicates.add("v.id NOT IN (:excludedVideoIds)");
    }

    if (viewerUserId != null && excludeViewedVideos) {
      predicates.add(
          """
          NOT EXISTS (
            SELECT i.id
            FROM VideoInteraction i
            WHERE i.user.id = :viewerUserId
              AND i.video.id = v.id
          )
          """);
    }

    String whereClause = "WHERE " + String.join("\nAND ", predicates) + "\n";

    var query =
        entityManager.createQuery(
            """
            SELECT v
            FROM VideoEntity v
            JOIN FETCH v.user
            """
                + whereClause
                + """
            ORDER BY function('RAND')
            """,
            VideoEntity.class);

    if (excludedVideoIds != null && !excludedVideoIds.isEmpty()) {
      query.setParameter("excludedVideoIds", excludedVideoIds);
    }
    if (viewerUserId != null && excludeViewedVideos) {
      query.setParameter("viewerUserId", viewerUserId);
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

  private static String counterColumnName(VideoCounterType type) {
    return switch (type) {
      case VIEW -> "view_count";
      case LIKE -> "like_count";
      case SHARE -> "share_count";
    };
  }
}
