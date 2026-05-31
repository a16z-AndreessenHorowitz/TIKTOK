package com.example.back.dto;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class RecordVideoViewRequest {

  @Min(value = 0, message = "watchTime không được âm")
  private Integer watchTime;
}
