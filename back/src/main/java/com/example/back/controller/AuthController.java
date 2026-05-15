package com.example.back.controller;

import java.time.Duration;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.back.config.AuthTokenProperties;
import com.example.back.dto.ApiResponse;
import com.example.back.dto.LoginRequest;
import com.example.back.dto.RegisterRequest;
import com.example.back.dto.auth.AccessTokenResponse;
import com.example.back.dto.auth.AuthTokenBundle;
import com.example.back.exception.InvalidTokenException;
import com.example.back.service.AuthService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;
  private final AuthTokenProperties authProps;

  @PostMapping("/login")
  public ResponseEntity<ApiResponse<Map<String, Object>>> login(
      @Valid @RequestBody LoginRequest body) {
    AuthTokenBundle bundle = authService.login(body);
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, refreshCookie(bundle.refreshToken()).toString())
        .body(
            ApiResponse.of(
                200, "Success", AccessTokenResponse.fromBundle(bundle).toMap()));
  }

  /**
   * Đọc refresh JWT từ cookie httpOnly, cấp access mới và xoay refresh (cookie mới).
   * Gọi khi F5 hoặc access hết hạn; frontend gửi kèm {@code credentials: 'include'}.
   */
  @PostMapping("/refresh")
  public ResponseEntity<ApiResponse<Map<String, Object>>> refresh(HttpServletRequest request) {
    String refreshJwt = readCookie(request, authProps.getRefreshCookieName());
    if (refreshJwt == null || refreshJwt.isBlank()) {
      throw new InvalidTokenException();
    }
    AuthTokenBundle bundle = authService.refreshFromCookie(refreshJwt);
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, refreshCookie(bundle.refreshToken()).toString())
        .body(
            ApiResponse.of(
                200, "Success", AccessTokenResponse.fromBundle(bundle).toMap()));
  }

  @PostMapping("/logout")
  public ResponseEntity<ApiResponse<Object>> logout() {
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
        .body(ApiResponse.of(200, "Đã đăng xuất", null));
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<Map<String, Object>> register(@Valid @RequestBody RegisterRequest body) {
    return ApiResponse.of(201, "Created successfully", authService.register(body));
  }

  private ResponseCookie refreshCookie(String refreshTokenValue) {
    return ResponseCookie.from(authProps.getRefreshCookieName(), refreshTokenValue)
        .httpOnly(true)
        .secure(authProps.isCookieSecure())
        .path("/")
        .maxAge(Duration.ofDays(authProps.getRefreshTtlDays()))
        .sameSite("Lax")
        .build();
  }

  private ResponseCookie clearRefreshCookie() {
    return ResponseCookie.from(authProps.getRefreshCookieName(), "")
        .httpOnly(true)
        .secure(authProps.isCookieSecure())
        .path("/")
        .maxAge(0)
        .sameSite("Lax")
        .build();
  }

  private static String readCookie(HttpServletRequest request, String name) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) {
      return null;
    }
    for (Cookie c : cookies) {
      if (name.equals(c.getName())) {
        return c.getValue();
      }
    }
    return null;
  }
}
