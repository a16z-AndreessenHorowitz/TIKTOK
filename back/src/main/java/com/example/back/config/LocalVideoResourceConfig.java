package com.example.back.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


@Configuration
public class LocalVideoResourceConfig implements WebMvcConfigurer {

  private final AvatarStorageProperties avatarStorageProperties;
  private final VideoStorageProperties videoStorageProperties;

  @Value("${app.avatar.url-prefix:/api/v1/users/avatars}")
  private String avatarUrlPrefix;

  public LocalVideoResourceConfig(
      AvatarStorageProperties avatarStorageProperties, VideoStorageProperties videoStorageProperties) {
    this.avatarStorageProperties = avatarStorageProperties;
    this.videoStorageProperties = videoStorageProperties;
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    addLocalResourceHandler(
        registry, videoStorageProperties.storageRoot(), "/api/v1/videos/files/**", "video");
    addLocalResourceHandler(
        registry,
        avatarStorageProperties.storageRoot(),
        normalizeResourcePattern(avatarUrlPrefix),
        "avatar");
  }

  private static void addLocalResourceHandler(
      ResourceHandlerRegistry registry, Path storageRoot, String resourcePattern, String label) {
    try {
      Files.createDirectories(storageRoot);
    } catch (IOException ex) {
      throw new IllegalStateException("Không tạo được thư mục lưu " + label + " local.", ex);
    }

    String resourceLocation = storageRoot.toUri().toString();
    if (!resourceLocation.endsWith("/")) {
      resourceLocation += "/";
    }

    registry
        .addResourceHandler(resourcePattern)
        .addResourceLocations(resourceLocation)
        .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic());
  }

  private static String normalizeResourcePattern(String urlPrefix) {
    String prefix =
        urlPrefix == null || urlPrefix.isBlank() ? "/api/v1/users/avatars" : urlPrefix.trim();
    if (prefix.endsWith("/")) {
      prefix = prefix.substring(0, prefix.length() - 1);
    }
    return prefix + "/**";
  }
}
