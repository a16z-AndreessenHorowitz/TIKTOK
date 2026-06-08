package com.example.back.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back.dto.CreateVideoCommentRequest;
import com.example.back.dto.VideoCommentDTO;
import com.example.back.entity.Comments;
import com.example.back.entity.UserEntity;
import com.example.back.entity.VideoEntity;
import com.example.back.repository.CommentRepository;
import com.example.back.repository.UserRepository;
import com.example.back.repository.VideoRepository;
import com.example.back.repository.VideoScoreDirtyRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommentService {

  private static final int DEFAULT_COMMENT_LIMIT = 20;
  private static final int MAX_COMMENT_LIMIT = 100;

  private final CommentRepository commentRepository;
  private final VideoRepository videoRepository;
  private final UserRepository userRepository;
  private final VideoScoreDirtyRepository videoScoreDirtyRepository;

  @Transactional(readOnly = true)
  public List<VideoCommentDTO> getVideoComments(long videoId) {
    return getVideoComments(videoId, null, DEFAULT_COMMENT_LIMIT);
  }

  @Transactional(readOnly = true)
  public List<VideoCommentDTO> getVideoComments(long videoId, Long beforeCommentId, int limit) {
    requireVideo(videoId);
    int pageSize = normalizeLimit(limit);

    List<Comments> roots = commentRepository.findRootsByVideoId(videoId, beforeCommentId, pageSize);
    List<Long> rootIds = roots.stream().map(Comments::getId).toList();
    Map<Long, List<Comments>> repliesByParentId =
        commentRepository.findRepliesByVideoIdAndParentIds(videoId, rootIds).stream()
            .collect(Collectors.groupingBy(reply -> reply.getParentComment().getId()));

    return roots.stream()
        .map(comment -> toDto(comment, repliesByParentId.getOrDefault(comment.getId(), List.of()), null))
        .toList();
  }

  @Transactional
  public VideoCommentDTO createComment(
      long videoId, long userId, CreateVideoCommentRequest request) {
    VideoEntity video = requireVideo(videoId);
    UserEntity user = userRepository.getReference(userId);
    Comments parentComment = resolveParent(videoId, request.getParentCommentId());

    Comments comment = new Comments();
    comment.setVideo(video);
    comment.setUser(user);
    comment.setParentComment(parentComment);
    comment.setContent(normalizeContent(request.getContent()));

    if (parentComment != null) {
      commentRepository.incrementReplyCount(parentComment.getId());
    }

    long nextVideoCommentCount = videoRepository.incrementCommentCount(videoId);

    VideoCommentDTO savedComment =
        toDto(commentRepository.save(comment), List.of(), nextVideoCommentCount);
    videoScoreDirtyRepository.markDirty(videoId);
    return savedComment;
  }

  private VideoEntity requireVideo(long videoId) {
    return videoRepository
        .findById(videoId)
        .orElseThrow(() -> new IllegalArgumentException("Video không tồn tại."));
  }

  private Comments resolveParent(long videoId, Long parentCommentId) {
    if (parentCommentId == null) {
      return null;
    }

    Comments parentComment =
        commentRepository
            .findById(parentCommentId)
            .orElseThrow(() -> new IllegalArgumentException("Bình luận cha không tồn tại."));

    if (Boolean.TRUE.equals(parentComment.getIsDeleted())) {
      throw new IllegalArgumentException("Bình luận cha không tồn tại.");
    }
    if (parentComment.getParentComment() != null) {
      throw new IllegalArgumentException("Chỉ hỗ trợ trả lời bình luận cấp 1.");
    }
    if (!Long.valueOf(videoId).equals(parentComment.getVideo().getId())) {
      throw new IllegalArgumentException("Bình luận cha không thuộc video này.");
    }

    return parentComment;
  }

  private VideoCommentDTO toDto(
      Comments comment, List<Comments> replies, Long videoCommentCount) {
    VideoEntity video = comment.getVideo();
    UserEntity user = comment.getUser();
    Comments parentComment = comment.getParentComment();

    return VideoCommentDTO.builder()
        .id(comment.getId())
        .videoId(video != null ? video.getId() : null)
        .parentCommentId(parentComment != null ? parentComment.getId() : null)
        .authorId(user != null ? user.getId() : null)
        .authorName(user != null ? user.getUsername() : null)
        .avatarUrl(user != null ? user.getAvatarUrl() : null)
        .content(comment.getContent())
        .likeCount(defaultInt(comment.getLikeCount()))
        .replyCount(defaultInt(comment.getReplyCount()))
        .createdAt(comment.getCreatedAt())
        .videoCommentCount(videoCommentCount)
        .replies(replies.stream().map(reply -> toDto(reply, List.of(), null)).toList())
        .build();
  }

  private static String normalizeContent(String content) {
    String normalized = content == null ? "" : content.trim();
    if (normalized.isBlank()) {
      throw new IllegalArgumentException("Nội dung bình luận không được để trống.");
    }
    return normalized;
  }

  private static int defaultInt(Integer value) {
    return value != null ? value : 0;
  }

  private static int normalizeLimit(int limit) {
    if (limit <= 0) {
      return DEFAULT_COMMENT_LIMIT;
    }
    return Math.min(limit, MAX_COMMENT_LIMIT);
  }
}
