package com.example.back.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateVideoCommentRequest {

  @NotBlank(message = "Nội dung bình luận không được để trống")
  @Size(max = 2000, message = "Bình luận tối đa 2000 ký tự")
  private String content;

  private Long parentCommentId;
}
