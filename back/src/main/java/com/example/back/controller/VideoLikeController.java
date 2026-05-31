package com.example.back.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.back.dto.ApiResponse;
import com.example.back.dto.VideoLikeStatusDTO;
import com.example.back.exception.InvalidTokenException;
import com.example.back.security.JwtTokenService;
import com.example.back.service.VideoLikeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/videos")
@RequiredArgsConstructor
public class VideoLikeController {

  private final VideoLikeService videoLikeService;
  private final JwtTokenService jwtTokenService;

  @GetMapping("/{videoId}/like")
  public ApiResponse<VideoLikeStatusDTO> getLikeStatus(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @PathVariable long videoId) {
    long userId = requireUserId(authorization);
    return ApiResponse.of(200, "Success", videoLikeService.getLikeStatus(userId, videoId));
  }

  @PostMapping("/{videoId}/like")
  public ApiResponse<VideoLikeStatusDTO> like(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @PathVariable long videoId) {
    long userId = requireUserId(authorization);
    return ApiResponse.of(200, "Liked", videoLikeService.like(userId, videoId));
  }

  @DeleteMapping("/{videoId}/like")
  public ApiResponse<VideoLikeStatusDTO> unlike(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @PathVariable long videoId) {
    long userId = requireUserId(authorization);
    return ApiResponse.of(200, "Unliked", videoLikeService.unlike(userId, videoId));
  }

  private long requireUserId(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      throw new InvalidTokenException();
    }
    String token = authorization.substring("Bearer ".length()).trim();
    if (token.isEmpty()) {
      throw new InvalidTokenException();
    }
    return jwtTokenService.parseAccessToken(token).userId();
  }
}
