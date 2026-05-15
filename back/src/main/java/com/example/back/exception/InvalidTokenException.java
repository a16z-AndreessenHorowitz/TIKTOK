package com.example.back.exception;

/** JWT không hợp lệ, hết hạn, hoặc sai loại (access/refresh). */
public class InvalidTokenException extends RuntimeException {

  public InvalidTokenException() {
    super("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
  }
}
