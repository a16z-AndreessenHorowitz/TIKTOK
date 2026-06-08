package com.example.back.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RecordVideoViewBatchRequest {

  @Valid
  @NotEmpty(message = "Danh sách interaction không được để trống")
  @Size(max = 50, message = "Mỗi batch tối đa 50 interaction")
  private List<Item> items;

  @Data
  public static class Item {

    @NotNull(message = "videoId không được để trống")
    private Long videoId;

    @DecimalMin(value = "0", message = "watchTime không được âm")
    private BigDecimal watchTime;
  }
}
