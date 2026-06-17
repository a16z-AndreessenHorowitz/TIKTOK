package com.example.back.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.back.entity.UserEntity.UserRole;
import com.example.back.exception.InvalidTokenException;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

@Service
public class JwtTokenService {

  private static final String CLAIM_USE = "use";
  private static final String USE_ACCESS = "access";
  private static final String USE_REFRESH = "refresh";

  @Value("${app.auth.jwt-secret:dev-only-change-me-please-use-32chars-min!!}")
  private String jwtSecret;

  @Value("${app.auth.access-ttl-minutes:15}")
  private long accessTtlMinutes;

  @Value("${app.auth.refresh-ttl-days:30}")
  private long refreshTtlDays;

  private SecretKey key;

  @PostConstruct
  void init() {
    byte[] bytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
    if (bytes.length < 32) {
      throw new IllegalStateException(
          "app.auth.jwt-secret must be at least 32 bytes (UTF-8) for HS256");
    }
    key = Keys.hmacShaKeyFor(bytes);
  }

  public String createAccessToken(long userId, String username, String email, UserRole role) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(accessTtlMinutes * 60);
    return Jwts.builder()
        .subject(String.valueOf(userId))
        .claim(CLAIM_USE, USE_ACCESS)
        .claim("username", username)
        .claim("email", email)
        .claim("role", role.name())
        .issuedAt(Date.from(now))
        .expiration(Date.from(exp))
        .signWith(key)
        .compact();
  }

  public String createRefreshToken(long userId) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(refreshTtlDays * 24 * 60 * 60);
    return Jwts.builder()
        .subject(String.valueOf(userId))
        .claim(CLAIM_USE, USE_REFRESH)
        .issuedAt(Date.from(now))
        .expiration(Date.from(exp))
        .signWith(key)
        .compact();
  }

  public AccessClaims parseAccessToken(String token) {
    try {
      Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
      if (!USE_ACCESS.equals(c.get(CLAIM_USE, String.class))) {
        throw new InvalidTokenException();
      }
      return new AccessClaims(
          Long.parseLong(c.getSubject()),
          c.get("username", String.class),
          c.get("email", String.class),
          UserRole.valueOf(c.get("role", String.class)));
    } catch (JwtException | IllegalArgumentException | NullPointerException e) {
      throw new InvalidTokenException();
    }
  }

  public long parseRefreshTokenUserId(String token) {
    try {
      Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
      if (!USE_REFRESH.equals(c.get(CLAIM_USE, String.class))) {
        throw new InvalidTokenException();
      }
      return Long.parseLong(c.getSubject());
    } catch (JwtException | NumberFormatException e) {
      throw new InvalidTokenException();
    }
  }

  public long accessTtlSeconds() {
    return accessTtlMinutes * 60;
  }

  public record AccessClaims(long userId, String username, String email, UserRole role) {
    public boolean hasRole(UserRole expectedRole) {
      return role == expectedRole;
    }
  }
}
