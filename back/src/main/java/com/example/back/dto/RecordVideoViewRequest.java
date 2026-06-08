package com.example.back.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

@Data
public class RecordVideoViewRequest {

  @DecimalMin(value = "0", message = "watchTime không được âm")
  private BigDecimal watchTime;
}
