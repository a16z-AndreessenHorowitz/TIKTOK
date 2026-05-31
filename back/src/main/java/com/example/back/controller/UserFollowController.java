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
import com.example.back.dto.FollowStatusDTO;
import com.example.back.exception.InvalidTokenException;
import com.example.back.security.JwtTokenService;
import com.example.back.service.FollowService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserFollowController {

  private final FollowService followService;
  private final JwtTokenService jwtTokenService;

  @GetMapping("/{userId}/follow")
  public ApiResponse<FollowStatusDTO> getFollowStatus(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @PathVariable long userId) {
    long followerId = requireUserId(authorization);
    return ApiResponse.of(200, "Success", followService.getFollowStatus(followerId, userId));
  }

  @PostMapping("/{userId}/follow")
  public ApiResponse<FollowStatusDTO> follow(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @PathVariable long userId) {
    long followerId = requireUserId(authorization);
    return ApiResponse.of(200, "Followed", followService.follow(followerId, userId));
  }

  @DeleteMapping("/{userId}/follow")
  public ApiResponse<FollowStatusDTO> unfollow(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @PathVariable long userId) {
    long followerId = requireUserId(authorization);
    return ApiResponse.of(200, "Unfollowed", followService.unfollow(followerId, userId));
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
