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

  public boolean existsById(long id) {
    List<?> rows =
        entityManager
            .createNativeQuery("SELECT 1 FROM users WHERE id = ? LIMIT 1")
            .setParameter(1, id)
            .getResultList();
    return !rows.isEmpty();
  }

  public void incrementFollowerCount(long userId) {
    updateCount(userId, "follower_count", 1);
  }

  public void decrementFollowerCount(long userId) {
    updateCount(userId, "follower_count", -1);
  }

  public void incrementFollowingCount(long userId) {
    updateCount(userId, "following_count", 1);
  }

  public void decrementFollowingCount(long userId) {
    updateCount(userId, "following_count", -1);
  }

  public long getFollowerCount(long userId) {
    return getLongColumn(userId, "follower_count");
  }

  public long getFollowingCount(long userId) {
    return getLongColumn(userId, "following_count");
  }

  public int updateProfile(
      long userId, String username, String displayName, String bio, String avatarUrl) {
    UserEntity user = entityManager.find(UserEntity.class, userId);
    if (user == null) {
      return 0;
    }
    user.setUsername(username);
    user.setDisplayName(displayName);
    user.setBio(bio);
    if (avatarUrl != null) {
      user.setAvatarUrl(avatarUrl);
    }
    entityManager.flush();
    entityManager.clear();
    return 1;
  }

  public int updatePasswordHash(long userId, String passwordHash) {
    UserEntity user = entityManager.find(UserEntity.class, userId);
    if (user == null) {
      return 0;
    }
    user.setPasswordHash(passwordHash);
    entityManager.flush();
    entityManager.clear();
    return 1;
  }

  private void updateCount(long userId, String columnName, int delta) {
    String expression =
        delta > 0
            ? "COALESCE(" + columnName + ", 0) + 1"
            : "GREATEST(COALESCE(" + columnName + ", 0) - 1, 0)";
    entityManager
        .createNativeQuery("UPDATE users SET " + columnName + " = " + expression + " WHERE id = ?")
        .setParameter(1, userId)
        .executeUpdate();
  }

  private long getLongColumn(long userId, String columnName) {
    Object value =
        entityManager
            .createNativeQuery("SELECT COALESCE(" + columnName + ", 0) FROM users WHERE id = ?")
            .setParameter(1, userId)
            .getSingleResult();
    return ((Number) value).longValue();
  }
}
