package com.example.back.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VideoCommentDTO {

  private Long id;
  private Long videoId;
  private Long parentCommentId;
  private Long authorId;
  private String authorName;
  private String avatarUrl;
  private String content;
  private Integer likeCount;
  private Integer replyCount;
  private LocalDateTime createdAt;
  private Long videoCommentCount;
  private List<VideoCommentDTO> replies;
}
