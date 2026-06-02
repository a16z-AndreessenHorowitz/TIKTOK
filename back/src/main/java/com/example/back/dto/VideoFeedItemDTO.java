package com.example.back.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VideoFeedItemDTO {

  private Long id;
  private String caption;
  private LocalDateTime createdAt;
  private VideoInfo video;
  private AuthorInfo author;
  private MusicInfo music;
  private StatsInfo stats;
  private ViewerInfo viewer;

  @Data
  @Builder
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class VideoInfo {
    private String playUrl;
    private String thumbnailUrl;
    private Integer duration;
  }

  @Data
  @Builder
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class AuthorInfo {
    private Long id;
    private String name;
    private String username;
    private String avatar;
  }

  @Data
  @Builder
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class MusicInfo {
    private String id;
    private String title;
  }

  @Data
  @Builder
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class StatsInfo {
    private Long views;
    private Long likes;
    private Long comments;
    private Long shares;
    private Long saves;
  }

  @Data
  @Builder
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class ViewerInfo {
    private Boolean liked;
    private Boolean followed;
    private Boolean saved;
  }
}
