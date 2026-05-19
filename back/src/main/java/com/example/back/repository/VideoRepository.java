package com.example.back.repository;

import java.util.List;

import org.springframework.stereotype.Repository;

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

  public List<VideoEntity> findFeed() {
    return entityManager
        .createQuery(
            """
            SELECT v
            FROM VideoEntity v
            JOIN FETCH v.user
            ORDER BY v.createdAt DESC
            """,
            VideoEntity.class)
        .getResultList();
  }
}
