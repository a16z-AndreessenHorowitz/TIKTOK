package com.example.back.repository;

import java.time.LocalDateTime;
import java.util.List;

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
}
