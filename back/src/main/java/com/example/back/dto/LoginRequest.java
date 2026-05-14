package com.example.back.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

  @NotBlank(message = "Nhập email hoặc TikTok ID")
  private String identifier;

  @NotBlank(message = "Nhập mật khẩu")
  private String password;
}
