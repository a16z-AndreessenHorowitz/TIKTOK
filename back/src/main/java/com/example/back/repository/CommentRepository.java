package com.example.back.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.example.back.entity.Comments;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Repository
public class CommentRepository {

  @PersistenceContext
  private EntityManager entityManager;

  public Comments save(Comments comment) {
    entityManager.persist(comment);
    entityManager.flush();
    return comment;
  }

  public Optional<Comments> findById(long id) {
    return Optional.ofNullable(entityManager.find(Comments.class, id));
  }

  public List<Comments> findRootsByVideoId(long videoId, Long beforeCommentId, int limit) {
    String cursorWhere = beforeCommentId == null ? "" : "AND c.id < :beforeCommentId";
    var query =
        entityManager
            .createQuery(
                """
                SELECT c
                FROM Comments c
                JOIN FETCH c.user
                WHERE c.video.id = :videoId
                  AND c.parentComment IS NULL
                  AND c.isDeleted = false
                """
                    + cursorWhere
                    + """
                ORDER BY c.createdAt DESC, c.id DESC
                """,
                Comments.class)
            .setParameter("videoId", videoId);

    if (beforeCommentId != null) {
      query.setParameter("beforeCommentId", beforeCommentId);
    }

    return query.setMaxResults(limit).getResultList();
  }

  public List<Comments> findRepliesByVideoIdAndParentIds(long videoId, List<Long> parentIds) {
    if (parentIds == null || parentIds.isEmpty()) {
      return List.of();
    }

    return entityManager
        .createQuery(
            """
            SELECT c
            FROM Comments c
            JOIN FETCH c.user
            JOIN FETCH c.parentComment p
            WHERE p.id IN :parentIds
              AND c.video.id = :videoId
              AND c.isDeleted = false
            ORDER BY c.createdAt ASC, c.id ASC
            """,
            Comments.class)
        .setParameter("videoId", videoId)
        .setParameter("parentIds", parentIds)
        .getResultList();
  }

  public void incrementReplyCount(long commentId) {
    entityManager
        .createNativeQuery(
            "UPDATE comments SET reply_count = COALESCE(reply_count, 0) + 1 WHERE id = ?")
        .setParameter(1, commentId)
        .executeUpdate();
  }
}
