package com.example.back.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserProfileDTO {

  private Long id;
  private String username;
  private String displayName;
  private String avatarUrl;
  private String bio;
  private Long followerCount;
  private Long followingCount;
  private Long likeCount;
  private Long videoCount;
  private Boolean self;
  private Boolean followed;
  private List<VideosResponseDTO> videos;
}
