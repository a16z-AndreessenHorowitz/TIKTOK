package com.example.back.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.back.dto.ApiResponse;
import com.example.back.dto.UserProfileDTO;
import com.example.back.security.JwtAuthorizationService;
import com.example.back.service.UserProfileService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserProfileController {

  private final UserProfileService userProfileService;
  private final JwtAuthorizationService jwtAuthorizationService;

  @GetMapping("/{username}/profile")
  public ApiResponse<UserProfileDTO> getProfile(
      @PathVariable String username,
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @RequestParam(value = "limit", required = false) Integer limit) {
    return ApiResponse.of(
        200,
        "Success",
        userProfileService.getProfile(
            username, jwtAuthorizationService.readOptionalUserId(authorization), limit));
  }

  @PatchMapping(value = "/me/profile", consumes = "multipart/form-data")
  public ApiResponse<UserProfileDTO> updateMyProfileWithAvatar(
      @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
      @RequestParam("username") String username,
      @RequestParam("displayName") String displayName,
      @RequestParam(value = "bio", required = false) String bio,
      @RequestPart(value = "avatar", required = false) MultipartFile avatar) {
    return ApiResponse.of(
        200,
        "Success",
        userProfileService.updateProfile(
            jwtAuthorizationService.requireUser(authorization).userId(),
            username,
            displayName,
            bio,
            avatar));
  }
}
