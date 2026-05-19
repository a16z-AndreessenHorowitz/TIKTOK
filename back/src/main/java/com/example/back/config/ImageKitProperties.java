package com.example.back.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.imagekit")
public class ImageKitProperties {

  private String publicKey;

  private String privateKey;

  private String urlEndpoint;

  private String webhookSecret;

  private String uploadFolder = "/videos";
}
