package com.example.back.exception;

public class ForbiddenException extends RuntimeException {

  public ForbiddenException() {
    super("Bạn không có quyền thực hiện thao tác này.");
  }
}
