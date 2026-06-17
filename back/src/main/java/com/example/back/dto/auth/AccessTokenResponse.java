package com.example.back.dto.auth;

import java.util.LinkedHashMap;
import java.util.Map;

/** Payload JSON cho client sau đăng nhập / refresh (không chứa refresh token). */
public record AccessTokenResponse(String accessToken, String tokenType, long expiresIn, AuthUserDto user) {

  public Map<String, Object> toMap() {
    Map<String, Object> userMap = new LinkedHashMap<>();
    userMap.put("id", user.id());
    userMap.put("username", user.username());
    userMap.put("email", user.email());
    userMap.put("avatarUrl", user.avatarUrl());
    userMap.put("role", user.role().name());
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("accessToken", accessToken);
    m.put("tokenType", tokenType);
    m.put("expiresIn", expiresIn);
    m.put("user", userMap);
    return m;
  }

  public static AccessTokenResponse fromBundle(AuthTokenBundle bundle) {
    return new AccessTokenResponse(
        bundle.accessToken(), "Bearer", bundle.expiresInSeconds(), bundle.user());
  }
}
