package com.example.back.exception;

public class DuplicateEmailException extends RuntimeException {

  public DuplicateEmailException() {
    super("Email đã được đăng ký");
  }
}
