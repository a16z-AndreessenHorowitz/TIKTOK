package com.example.back.exception;

public class BadLoginException extends RuntimeException {

  public BadLoginException() {
    super("Email/TikTok ID hoặc mật khẩu không đúng");
  }
}
