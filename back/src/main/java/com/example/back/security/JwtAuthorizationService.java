package com.example.back.security;

import org.springframework.stereotype.Service;

import com.example.back.entity.UserEntity.UserRole;
import com.example.back.exception.ForbiddenException;
import com.example.back.exception.InvalidTokenException;
import com.example.back.security.JwtTokenService.AccessClaims;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JwtAuthorizationService {

  private static final String BEARER_PREFIX = "Bearer ";

  private final JwtTokenService jwtTokenService;

  public AccessClaims requireUser(String authorization) {
    return jwtTokenService.parseAccessToken(extractBearerToken(authorization));
  }

  public Long readOptionalUserId(String authorization) {
    if (authorization == null || authorization.isBlank()) {
      return null;
    }
    return requireUser(authorization).userId();
  }

  public AccessClaims requireRole(String authorization, UserRole role) {
    AccessClaims claims = requireUser(authorization);
    if (!claims.hasRole(role)) {
      throw new ForbiddenException();
    }
    return claims;
  }

  private String extractBearerToken(String authorization) {
    if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
      throw new InvalidTokenException();
    }
    String token = authorization.substring(BEARER_PREFIX.length()).trim();
    if (token.isEmpty()) {
      throw new InvalidTokenException();
    }
    return token;
  }
}
