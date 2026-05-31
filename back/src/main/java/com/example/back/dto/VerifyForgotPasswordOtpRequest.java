package com.example.back.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyForgotPasswordOtpRequest {

  @NotBlank(message = "Nhập email hoặc TikTok ID")
  private String identifier;

  @NotBlank(message = "Nhập mã OTP")
  @Pattern(regexp = "^\\d{6}$", message = "Mã OTP gồm 6 chữ số")
  private String otp;
}
