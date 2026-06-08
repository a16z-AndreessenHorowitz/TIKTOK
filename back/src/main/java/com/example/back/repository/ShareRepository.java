package com.example.back.repository;

import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Repository
public class ShareRepository {

  @PersistenceContext
  private EntityManager entityManager;

  public void insert(long userId, long videoId) {
    entityManager
        .createNativeQuery(
            """
            INSERT INTO shares (user_id, video_id, created_at)
            VALUES (?, ?, NOW())
            """)
        .setParameter(1, userId)
        .setParameter(2, videoId)
        .executeUpdate();
  }
}
