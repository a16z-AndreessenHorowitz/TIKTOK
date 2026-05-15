package com.example.back.dto.auth;

/** Kết quả đăng nhập: access JWT (JSON) + refresh JWT (chỉ gửi qua cookie). */
public record AuthTokenBundle(
    String accessToken, String refreshToken, long expiresInSeconds, AuthUserDto user) {}
