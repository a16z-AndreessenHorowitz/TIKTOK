package com.example.back.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetForgotPasswordRequest {

  @NotBlank(message = "Thiếu phiên xác thực OTP")
  private String resetToken;

  @NotBlank(message = "Nhập mật khẩu mới")
  @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự")
  private String newPassword;
}
