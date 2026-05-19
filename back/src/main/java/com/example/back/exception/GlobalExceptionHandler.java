package com.example.back.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.example.back.dto.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ApiResponse<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
    Map<String, String> fieldErrors = new LinkedHashMap<>();
    for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
      fieldErrors.put(fe.getField(), fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid");
    }
    String message =
        fieldErrors.isEmpty()
            ? "Dữ liệu không hợp lệ"
            : fieldErrors.values().iterator().next();
    return ApiResponse.of(400, message, fieldErrors.isEmpty() ? null : fieldErrors);
  }

  @ExceptionHandler(DuplicateEmailException.class)
  @ResponseStatus(HttpStatus.CONFLICT)
  public ApiResponse<Object> handleDuplicateEmail(DuplicateEmailException ex) {
    return ApiResponse.of(409, ex.getMessage(), null);
  }

  @ExceptionHandler(BadLoginException.class)
  @ResponseStatus(HttpStatus.UNAUTHORIZED)
  public ApiResponse<Object> handleBadLogin(BadLoginException ex) {
    return ApiResponse.of(401, ex.getMessage(), null);
  }

  @ExceptionHandler(InvalidTokenException.class)
  @ResponseStatus(HttpStatus.UNAUTHORIZED)
  public ApiResponse<Object> handleInvalidToken(InvalidTokenException ex) {
    return ApiResponse.of(401, ex.getMessage(), null);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ApiResponse<Object> handleBadRequest(IllegalArgumentException ex) {
    return ApiResponse.of(400, ex.getMessage(), null);
  }

  @ExceptionHandler(ImageKitUploadException.class)
  @ResponseStatus(HttpStatus.BAD_GATEWAY)
  public ApiResponse<Object> handleImageKitUpload(ImageKitUploadException ex) {
    return ApiResponse.of(502, ex.getMessage(), null);
  }
}
