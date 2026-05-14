package com.example.back.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Envelope JSON dùng chung: mọi API trả {@code status}, {@code message}, payload trong {@code data}. */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

  private int status;
  private String message;
  private T data;

  public static <T> ApiResponse<T> of(int status, String message, T data) {
    return ApiResponse.<T>builder().status(status).message(message).data(data).build();
  }
}
