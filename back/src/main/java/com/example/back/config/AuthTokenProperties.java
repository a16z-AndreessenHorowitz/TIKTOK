package com.example.back.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

@Data
@ConfigurationProperties(prefix = "app.auth")
public class AuthTokenProperties {

  /** HMAC secret; tối thiểu 32 byte cho HS256. */
  private String jwtSecret =
      "dev-only-change-me-please-use-32chars-min!!";

  private long accessTtlMinutes = 15;
  private long refreshTtlDays = 30;
  private String refreshCookieName = "tt_refresh_token";
  /** Bật true khi chạy HTTPS production. */
  private boolean cookieSecure = false;
}
