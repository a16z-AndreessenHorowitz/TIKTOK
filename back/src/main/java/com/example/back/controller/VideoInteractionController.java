package com.example.back.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.back.dto.ApiResponse;
import com.example.back.dto.RecordVideoViewBatchRequest;
import com.example.back.dto.RecordVideoViewRequest;
import com.example.back.dto.VideoInteractionDTO;
import com.example.back.security.JwtAuthorizationService;
import com.example.back.service.VideoInteractionService;
import com.example.back.service.VideoShareService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequestMapping("/api/v1/videos")
@RequiredArgsConstructor
public class VideoInteractionController {

  private final VideoInteractionService videoInteractionService;
  private final VideoShareService videoShareService;
  private final JwtAuthorizationService jwtAuthorizationService;

  @PostMapping("/{videoId}/interactions/view")
  public ApiResponse<VideoInteractionDTO> recordView(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @PathVariable long videoId,
      @Valid @RequestBody RecordVideoViewRequest body) {
    long userId = jwtAuthorizationService.requireUser(authorization).userId();
    return ApiResponse.of(
        201, "Recorded", videoInteractionService.recordView(userId, videoId, body));
  }

  /** Batch ghi nhiều watch-time trong 1 request — giảm N request/phiên xuống còn 1. */
  @PostMapping("/interactions/view/batch")
  public ApiResponse<List<VideoInteractionDTO>> recordViewBatch(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @Valid @RequestBody RecordVideoViewBatchRequest body) {
    long userId = jwtAuthorizationService.requireUser(authorization).userId();
    return ApiResponse.of(201, "Recorded", videoInteractionService.recordViewBatch(userId, body));
  }

  @PostMapping("/{videoId}/share")
  public ApiResponse<Void> recordShare(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @PathVariable long videoId) {
    long userId = jwtAuthorizationService.requireUser(authorization).userId();
    videoShareService.share(userId, videoId);
    return ApiResponse.of(201, "Shared", null);
  }
}
