package com.example.back.exception;

public class VideoStorageException extends RuntimeException {

  public VideoStorageException(String message, Throwable cause) {
    super(message, cause);
  }
}
