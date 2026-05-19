package com.example.back.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

import io.imagekit.client.ImageKitClient;
import io.imagekit.client.okhttp.ImageKitOkHttpClient;
import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class ImageKitConfig {

  private final ImageKitProperties properties;

  @Bean
  @Lazy
  ImageKitClient imageKitClient() {
    return ImageKitOkHttpClient.builder()
        .privateKey(properties.getPrivateKey())
        .webhookSecret(properties.getWebhookSecret())
        .build();
  }
}
