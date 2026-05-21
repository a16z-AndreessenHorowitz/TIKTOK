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

import com.example.back.exception.VideoStorageException;

@Service
public class LocalVideoStorageService {

  private static final Set<String> ACCEPTED_EXTENSIONS =
      Set.of(".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v");

  @Value("${app.video.storage-dir}")
  private String storageDir;

  @Value("${app.video.url-prefix:/api/v1/videos/files}")
  private String urlPrefix;

  public StoredVideo store(MultipartFile file) {
    validateFile(file);

    Path storageRoot = Path.of(storageDir).toAbsolutePath().normalize();
    String fileName = buildFileName(file);
    Path destination = storageRoot.resolve(fileName).normalize();
    if (!destination.startsWith(storageRoot)) {
      throw new IllegalArgumentException("Tên file video không hợp lệ.");
    }

    try {
      Files.createDirectories(storageRoot);
      try (InputStream input = file.getInputStream()) {
        Files.copy(input, destination);
      }
    } catch (IOException ex) {
      throw new VideoStorageException("Không lưu được video vào máy local.", ex);
    }

    String encodedFileName = UriUtils.encodePathSegment(fileName, StandardCharsets.UTF_8);
    return new StoredVideo(normalizeUrlPrefix(urlPrefix) + "/" + encodedFileName, null);
  }

  private static void validateFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new IllegalArgumentException("Không có video để upload.");
    }

    String extension = extensionFromOriginalName(file.getOriginalFilename());
    String contentType = Objects.toString(file.getContentType(), "");
    boolean hasVideoContentType = contentType.startsWith("video/");
    boolean hasAcceptedExtension = ACCEPTED_EXTENSIONS.contains(extension);
    if (!hasVideoContentType && !hasAcceptedExtension) {
      throw new IllegalArgumentException("File upload phải là video.");
    }
  }

  private static String buildFileName(MultipartFile file) {
    String original = StringUtils.cleanPath(Objects.toString(file.getOriginalFilename(), "video"));
    String extension = extensionFromOriginalName(original);
    if (!ACCEPTED_EXTENSIONS.contains(extension)) {
      extension = extensionFromContentType(file.getContentType());
    }

    String baseName = original;
    int dotIndex = original.lastIndexOf('.');
    if (dotIndex > 0) {
      baseName = original.substring(0, dotIndex);
    }

    String safeBaseName = baseName.replaceAll("[^a-zA-Z0-9._-]", "_");
    if (!StringUtils.hasText(safeBaseName)) {
      safeBaseName = "video";
    }
    if (safeBaseName.length() > 80) {
      safeBaseName = safeBaseName.substring(0, 80);
    }

    return Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + "-" + safeBaseName + extension;
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
    if (normalized.contains("webm")) {
      return ".webm";
    }
    if (normalized.contains("quicktime")) {
      return ".mov";
    }
    return ".mp4";
  }

  private static String normalizeUrlPrefix(String value) {
    String prefix = StringUtils.hasText(value) ? value.trim() : "/api/v1/videos/files";
    return prefix.endsWith("/") ? prefix.substring(0, prefix.length() - 1) : prefix;
  }

  public record StoredVideo(String url, String thumbnailUrl) {}
}
