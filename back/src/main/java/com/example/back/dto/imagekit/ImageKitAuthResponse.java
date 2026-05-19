package com.example.back.dto.imagekit;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ImageKitAuthResponse {
  private String token;
  private Long expire;
  private String signature;
  private String publicKey;
  private String urlEndpoint;
}
