package com.example.back.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class LocalVideoResourceConfig implements WebMvcConfigurer {

  private final VideoStorageProperties videoStorageProperties;

  public LocalVideoResourceConfig(VideoStorageProperties videoStorageProperties) {
    this.videoStorageProperties = videoStorageProperties;
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    Path storageRoot = videoStorageProperties.storageRoot();
    try {
      Files.createDirectories(storageRoot);
    } catch (IOException ex) {
      throw new IllegalStateException("Không tạo được thư mục lưu video local.", ex);
    }

    String resourceLocation = storageRoot.toUri().toString();
    if (!resourceLocation.endsWith("/")) {
      resourceLocation += "/";
    }

    registry
        .addResourceHandler("/api/v1/videos/files/**")
        .addResourceLocations(resourceLocation)
        .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic());
  }
}
