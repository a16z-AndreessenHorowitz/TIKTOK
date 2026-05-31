package com.example.back.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.back.dto.ApiResponse;
import com.example.back.dto.CreateVideoCommentRequest;
import com.example.back.dto.VideoCommentDTO;
import com.example.back.exception.InvalidTokenException;
import com.example.back.security.JwtTokenService;
import com.example.back.service.CommentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequestMapping("/api/v1/videos/{videoId}/comments")
@RequiredArgsConstructor
public class CommentController {

  private final CommentService commentService;
  private final JwtTokenService jwtTokenService;

  @GetMapping
  public ApiResponse<List<VideoCommentDTO>> getVideoComments(
      @PathVariable long videoId,
      @RequestParam(value = "beforeCommentId", required = false) Long beforeCommentId,
      @RequestParam(value = "limit", defaultValue = "20") int limit) {
    return ApiResponse.of(
        200, "Success", commentService.getVideoComments(videoId, beforeCommentId, limit));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<VideoCommentDTO> createComment(
      @PathVariable long videoId,
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @Valid @RequestBody CreateVideoCommentRequest body) {
    long userId = requireUserId(authorization);
    return ApiResponse.of(201, "Created", commentService.createComment(videoId, userId, body));
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
