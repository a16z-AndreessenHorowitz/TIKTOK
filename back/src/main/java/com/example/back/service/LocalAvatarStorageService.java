package com.example.back.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import com.example.back.config.AvatarStorageProperties;
import com.example.back.exception.VideoStorageException;

@Service
public class LocalAvatarStorageService {

  private static final Set<String> ACCEPTED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp");

  private final AvatarStorageProperties avatarStorageProperties;

  @Value("${app.avatar.url-prefix:/api/v1/users/avatars}")
  private String urlPrefix;

  public LocalAvatarStorageService(AvatarStorageProperties avatarStorageProperties) {
    this.avatarStorageProperties = avatarStorageProperties;
  }

  public String store(MultipartFile file) {
    validateFile(file);

    Path storageRoot = avatarStorageProperties.storageRoot();
    String fileName = buildFileName(file);
    Path destination = storageRoot.resolve(fileName).normalize();
    if (!destination.startsWith(storageRoot)) {
      throw new IllegalArgumentException("Tên file ảnh không hợp lệ.");
    }

    try {
      Files.createDirectories(storageRoot);
      try (InputStream input = file.getInputStream()) {
        Files.copy(input, destination);
      }
    } catch (IOException ex) {
      throw new VideoStorageException("Không lưu được ảnh hồ sơ vào máy local.", ex);
    }

    String encodedFileName = UriUtils.encodePathSegment(fileName, StandardCharsets.UTF_8);
    return normalizeUrlPrefix(urlPrefix) + "/" + encodedFileName;
  }

  private static void validateFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      return;
    }

    String extension = extensionFromOriginalName(file.getOriginalFilename());
    String contentType = Objects.toString(file.getContentType(), "");
    boolean hasImageContentType = contentType.startsWith("image/");
    boolean hasAcceptedExtension = ACCEPTED_EXTENSIONS.contains(extension);
    if (!hasImageContentType && !hasAcceptedExtension) {
      throw new IllegalArgumentException("File upload phải là ảnh.");
    }
  }

  private static String buildFileName(MultipartFile file) {
    String original = StringUtils.cleanPath(Objects.toString(file.getOriginalFilename(), "avatar"));
    String extension = extensionFromOriginalName(original);
    if (!ACCEPTED_EXTENSIONS.contains(extension)) {
      extension = extensionFromContentType(file.getContentType());
    }

    return Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + "-avatar" + extension;
  }

  private static String extensionFromOriginalName(String originalName) {
    String cleanName = StringUtils.cleanPath(Objects.toString(originalName, ""));
    int dotIndex = cleanName.lastIndexOf('.');
    if (dotIndex < 0 || dotIndex == cleanName.length() - 1) {
      return "";
    }
    return cleanName.substring(dotIndex).toLowerCase(Locale.ROOT);
  }

  private static String extensionFromContentType(String contentType) {
    String normalized = Objects.toString(contentType, "").toLowerCase(Locale.ROOT);
    if (normalized.contains("png")) {
      return ".png";
    }
    if (normalized.contains("webp")) {
      return ".webp";
    }
    return ".jpg";
  }

  private static String normalizeUrlPrefix(String value) {
    String prefix = StringUtils.hasText(value) ? value.trim() : "/api/v1/users/avatars";
    return prefix.endsWith("/") ? prefix.substring(0, prefix.length() - 1) : prefix;
  }
}
