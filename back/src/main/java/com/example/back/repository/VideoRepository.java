package com.example.back.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.example.back.entity.VideoEntity;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
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

  public void refreshRecommendationScore(long videoId) {
    entityManager
        .createNativeQuery(recommendationScoreUpdateSql("WHERE v.id = ?"))
        .setParameter(1, videoId)
        .executeUpdate();
  }

  private static String recommendationScoreUpdateSql(String whereClause) {
    return """
        UPDATE videos v
        SET recommendation_score = GREATEST(
            (
              COALESCE(v.like_count, 0) * 3
              + COALESCE(v.comment_count, 0) * 5
              + (
                  SELECT COUNT(*)
                  FROM shares s
                  WHERE s.video_id = v.id
                ) * 8
              + COALESCE(v.save_count, 0) * 4
              + COALESCE((
                  SELECT AVG(vi.completion_rate)
                  FROM video_interactions vi
                  WHERE vi.video_id = v.id
                    AND vi.interaction_type IN ('VIEW', 'SKIP')
                ), 0) * 100
              + (
                  SELECT COUNT(*)
                  FROM video_interactions ri
                  WHERE ri.video_id = v.id
                    AND ri.is_rewatch = TRUE
                ) * 20
              + LOG(COALESCE(v.view_count, 0) + 1) * 10
              - (TIMESTAMPDIFF(HOUR, v.created_at, CURRENT_TIMESTAMP) / 24) * 5
            ),
            0
          )
        """
        + whereClause;
  }

  public List<VideoEntity> findFeedPage(
      Long viewerUserId,
      List<Long> excludedVideoIds,
      BigDecimal cursorRecommendationScore,
      LocalDateTime cursorCreatedAt,
      Long cursorId,
      int limit) {
    String scoreExpression =
        """
        (
          COALESCE(v.recommendation_score, 0)
          + COALESCE((
              SELECT SUM(utp.score)
              FROM user_tag_preferences utp
              JOIN video_hashtags vh ON vh.tag_id = utp.tag_id
              WHERE vh.video_id = v.id
                AND utp.user_id = :viewerUserId
            ), 0)
        )
        """;
    List<String> predicates = new ArrayList<>();
    if (excludedVideoIds != null && !excludedVideoIds.isEmpty()) {
      predicates.add("v.id NOT IN (:excludedVideoIds)");
    }
    if (viewerUserId != null) {
      predicates.add(
          """
          NOT EXISTS (
            SELECT 1
            FROM video_interactions i
            WHERE i.user_id = :viewerUserId
              AND i.video_id = v.id
          )
          """);
    }
    if (cursorRecommendationScore != null && cursorCreatedAt != null && cursorId != null) {
      predicates.add(
          "("
              + scoreExpression
              + """
              < :cursorRecommendationScore
              OR (
                """
              + scoreExpression
              + """
                = :cursorRecommendationScore
                AND (
                  v.created_at < :cursorCreatedAt
                  OR (v.created_at = :cursorCreatedAt AND v.id < :cursorId)
                )
              )
            )
            """);
    }

    String whereClause =
        predicates.isEmpty() ? "" : "WHERE " + String.join("\nAND ", predicates) + "\n";

    Query query =
        entityManager.createNativeQuery(
            """
            SELECT v.*
            FROM videos v
            """
                + whereClause
                + """
            ORDER BY
            """
                + scoreExpression
                + """
            DESC, v.created_at DESC, v.id DESC
            """,
            VideoEntity.class);

    query.setParameter("viewerUserId", viewerUserId);
    if (excludedVideoIds != null && !excludedVideoIds.isEmpty()) {
      query.setParameter("excludedVideoIds", excludedVideoIds);
    }
    if (cursorRecommendationScore != null && cursorCreatedAt != null && cursorId != null) {
      query.setParameter("cursorRecommendationScore", cursorRecommendationScore);
      query.setParameter("cursorCreatedAt", cursorCreatedAt);
      query.setParameter("cursorId", cursorId);
    }

    return query.setMaxResults(limit).getResultList();
  }

  public BigDecimal calculateFeedScore(Long viewerUserId, long videoId) {
    Object value =
        entityManager
            .createNativeQuery(
                """
                SELECT
                  COALESCE(v.recommendation_score, 0)
                  + COALESCE((
                      SELECT SUM(utp.score)
                      FROM user_tag_preferences utp
                      JOIN video_hashtags vh ON vh.tag_id = utp.tag_id
                      WHERE vh.video_id = v.id
                        AND utp.user_id = ?
                    ), 0)
                FROM videos v
                WHERE v.id = ?
                """)
            .setParameter(1, viewerUserId)
            .setParameter(2, videoId)
            .getSingleResult();
    return value instanceof BigDecimal score ? score : new BigDecimal(String.valueOf(value));
  }

  public List<VideoEntity> findRandomFeedPage(
      Long viewerUserId, List<Long> excludedVideoIds, int limit) {
    if (limit <= 0) {
      return List.of();
    }

    List<String> predicates = new ArrayList<>();
    if (excludedVideoIds != null && !excludedVideoIds.isEmpty()) {
      predicates.add("v.id NOT IN :excludedVideoIds");
    }
    if (viewerUserId != null) {
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
    String whereClause =
        predicates.isEmpty() ? "" : "WHERE " + String.join("\nAND ", predicates) + "\n";

    TypedQuery<VideoEntity> query =
        entityManager.createQuery(
            """
            SELECT v
            FROM VideoEntity v
            JOIN FETCH v.user
            """
                + whereClause
                + """
            ORDER BY FUNCTION('RAND')
            """,
            VideoEntity.class);

    if (excludedVideoIds != null && !excludedVideoIds.isEmpty()) {
      query.setParameter("excludedVideoIds", excludedVideoIds);
    }
    if (viewerUserId != null) {
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
}
