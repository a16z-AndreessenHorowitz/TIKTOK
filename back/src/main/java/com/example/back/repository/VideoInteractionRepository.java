package com.example.back.repository;

import org.springframework.stereotype.Repository;

import com.example.back.entity.VideoInteraction;
import com.example.back.entity.VideoInteraction.VideoInteractionType;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Repository
public class VideoInteractionRepository {

  @PersistenceContext
  private EntityManager entityManager;

  public VideoInteraction save(VideoInteraction interaction) {
    entityManager.persist(interaction);
    entityManager.flush();
    return interaction;
  }

  public long countByUserIdAndVideoIdAndInteractionType(
      long userId, long videoId, VideoInteractionType interactionType) {
    return entityManager
        .createQuery(
            """
            SELECT COUNT(i)
            FROM VideoInteraction i
            WHERE i.user.id = :userId
              AND i.video.id = :videoId
              AND i.interactionType = :interactionType
            """,
            Long.class)
        .setParameter("userId", userId)
        .setParameter("videoId", videoId)
        .setParameter("interactionType", interactionType)
        .getSingleResult();
  }
}
