package com.example.back.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.back.dto.ApiResponse;
import com.example.back.dto.VideoFeedResponseDTO;
import com.example.back.dto.VideosResponseDTO;
import com.example.back.security.JwtAuthorizationService;
import com.example.back.service.FeedService;
import com.example.back.service.VideoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/videos")
@RequiredArgsConstructor
public class VideoController {

  private final VideoService videoService;
  private final FeedService feedService;
  private final JwtAuthorizationService jwtAuthorizationService;

  @GetMapping("/feed")
  public ApiResponse<VideoFeedResponseDTO> getVideoFeed(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @RequestParam(value = "cursor", required = false) String cursor,
      @RequestParam(value = "excludeIds", required = false) String excludeIds,
      @RequestParam(value = "limit", required = false) Integer limit) {
    return ApiResponse.of(
        200,
        "Success",
        feedService.getFeed(
            cursor, limit, jwtAuthorizationService.readOptionalUserId(authorization), excludeIds));
  }

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<VideosResponseDTO> uploadVideo(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "caption", required = false) String caption) {
    long userId = jwtAuthorizationService.requireUser(authorization).userId();
    return ApiResponse.of(201, "Uploaded", videoService.uploadVideo(userId, file, caption));
  }
}
