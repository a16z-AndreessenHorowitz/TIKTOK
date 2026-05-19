package com.example.back.dto.imagekit;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ImageKitUploadResponse {
  private String fileId;
  private String name;
  private String url;
  private String thumbnailUrl;
  private String filePath;
  private String fileType;
  private Long size;
}
