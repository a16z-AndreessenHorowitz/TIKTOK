package com.example.back.dto.imagekit;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ImageKitUploadResponse {

  private String fileId;
  private String name;
  private String url;
  private String thumbnailUrl;
  private String filePath;
  private String fileType;
  private Long size;
}
