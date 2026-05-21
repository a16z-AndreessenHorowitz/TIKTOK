package com.example.back.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.example.back.entity.UserEntity;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Repository thủ công (EntityManager + native SQL), không extends {@code JpaRepository}.
 * {@code WHERE email = ?} / {@code username = ?} dùng index unique trên bảng {@code users}.
 */
@Repository
public class UserRepository {

  @PersistenceContext
  private EntityManager entityManager;

  public void save(UserEntity user) {
    entityManager.persist(user);
    entityManager.flush();
  }

  public boolean existsByEmail(String email) {
    List<?> rows =
        entityManager
            .createNativeQuery("SELECT 1 FROM users WHERE email = ? LIMIT 1")
            .setParameter(1, email)
            .getResultList();
    return !rows.isEmpty();
  }

  public boolean existsByUsername(String username) {
    List<?> rows =
        entityManager
            .createNativeQuery("SELECT 1 FROM users WHERE username = ? LIMIT 1")
            .setParameter(1, username)
            .getResultList();
    return !rows.isEmpty();
  }

  public Optional<UserEntity> findByEmail(String email) {
    return entityManager
        .createQuery("SELECT u FROM UserEntity u WHERE u.email = :e", UserEntity.class)
        .setParameter("e", email)
        .setMaxResults(1)
        .getResultStream()
        .findFirst();
  }

  public Optional<UserEntity> findByUsername(String username) {
    return entityManager
        .createQuery("SELECT u FROM UserEntity u WHERE u.username = :n", UserEntity.class)
        .setParameter("n", username)
        .setMaxResults(1)
        .getResultStream()
        .findFirst();
  }

  public Optional<UserEntity> findById(long id) {
    return Optional.ofNullable(entityManager.find(UserEntity.class, id));
  }

  public UserEntity getReference(long id) {
    return entityManager.getReference(UserEntity.class, id);
  }
}
