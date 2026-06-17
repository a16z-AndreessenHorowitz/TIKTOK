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
import com.example.back.dto.VideoSaveStatusDTO;
import com.example.back.security.JwtAuthorizationService;
import com.example.back.service.VideoSaveService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/videos")
@RequiredArgsConstructor
public class VideoSaveController {

  private final VideoSaveService videoSaveService;
  private final JwtAuthorizationService jwtAuthorizationService;

  @GetMapping("/{videoId}/save")
  public ApiResponse<VideoSaveStatusDTO> getSaveStatus(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @PathVariable long videoId) {
    long userId = jwtAuthorizationService.requireUser(authorization).userId();
    return ApiResponse.of(200, "Success", videoSaveService.getSaveStatus(userId, videoId));
  }

  @PostMapping("/{videoId}/save")
  public ApiResponse<VideoSaveStatusDTO> save(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @PathVariable long videoId) {
    long userId = jwtAuthorizationService.requireUser(authorization).userId();
    return ApiResponse.of(200, "Saved", videoSaveService.save(userId, videoId));
  }

  @DeleteMapping("/{videoId}/save")
  public ApiResponse<VideoSaveStatusDTO> unsave(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @PathVariable long videoId) {
    long userId = jwtAuthorizationService.requireUser(authorization).userId();
    return ApiResponse.of(200, "Unsaved", videoSaveService.unsave(userId, videoId));
  }
}
