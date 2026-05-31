package com.example.back.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.back.dto.ApiResponse;
import com.example.back.dto.RecordVideoViewRequest;
import com.example.back.dto.VideoInteractionDTO;
import com.example.back.entity.VideoInteraction.VideoInteractionType;
import com.example.back.exception.InvalidTokenException;
import com.example.back.security.JwtTokenService;
import com.example.back.service.VideoInteractionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequestMapping("/api/v1/videos")
@RequiredArgsConstructor
public class VideoInteractionController {

  private final VideoInteractionService videoInteractionService;
  private final JwtTokenService jwtTokenService;

  @PostMapping("/{videoId}/interactions/view")
  public ApiResponse<VideoInteractionDTO> recordView(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @PathVariable long videoId,
      @Valid @RequestBody RecordVideoViewRequest body) {
    long userId = requireUserId(authorization);
    return ApiResponse.of(
        201, "Recorded", videoInteractionService.recordView(userId, videoId, body));
  }

  @PostMapping("/{videoId}/share")
  public ApiResponse<VideoInteractionDTO> recordShare(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @PathVariable long videoId) {
    long userId = requireUserId(authorization);
    return ApiResponse.of(
        201,
        "Shared",
        videoInteractionService.recordAction(userId, videoId, VideoInteractionType.SHARE));
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
