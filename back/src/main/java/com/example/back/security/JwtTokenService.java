package com.example.back.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.example.back.config.AuthTokenProperties;
import com.example.back.exception.InvalidTokenException;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JwtTokenService {

  private static final String CLAIM_USE = "use";
  private static final String USE_ACCESS = "access";
  private static final String USE_REFRESH = "refresh";

  private final AuthTokenProperties props;
  private SecretKey key;

  @PostConstruct
  void init() {
    byte[] bytes = props.getJwtSecret().getBytes(StandardCharsets.UTF_8);
    if (bytes.length < 32) {
      throw new IllegalStateException(
          "app.auth.jwt-secret must be at least 32 bytes (UTF-8) for HS256");
    }
    key = Keys.hmacShaKeyFor(bytes);
  }

  public String createAccessToken(long userId, String username, String email) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(props.getAccessTtlMinutes() * 60);
    return Jwts.builder()
        .subject(String.valueOf(userId))
        .claim(CLAIM_USE, USE_ACCESS)
        .claim("username", username)
        .claim("email", email)
        .issuedAt(Date.from(now))
        .expiration(Date.from(exp))
        .signWith(key)
        .compact();
  }

  public String createRefreshToken(long userId) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(props.getRefreshTtlDays() * 24 * 60 * 60);
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
          c.get("email", String.class));
    } catch (JwtException | NumberFormatException e) {
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
    return props.getAccessTtlMinutes() * 60;
  }

  public record AccessClaims(long userId, String username, String email) {}
}
