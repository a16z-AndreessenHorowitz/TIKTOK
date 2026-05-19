package com.example.back.service;

import java.io.IOException;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.back.config.ImageKitProperties;
import com.example.back.dto.imagekit.ImageKitAuthResponse;
import com.example.back.dto.imagekit.ImageKitUploadResponse;

import io.imagekit.client.ImageKitClient;
import io.imagekit.models.files.FileUploadParams;
import io.imagekit.models.files.FileUploadResponse;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ImageKitService {

  private final ImageKitClient imageKitClient;
  private final ImageKitProperties properties;

  public ImageKitAuthResponse getAuthenticationParameters() {
    ensureConfigured();
    Map<String, Object> authParams = imageKitClient.helper().getAuthenticationParameters(null, null);

    return ImageKitAuthResponse.builder()
        .token((String) authParams.get("token"))
        .expire(((Number) authParams.get("expire")).longValue())
        .signature((String) authParams.get("signature"))
        .publicKey(properties.getPublicKey())
        .urlEndpoint(properties.getUrlEndpoint())
        .build();
  }

  public ImageKitUploadResponse upload(MultipartFile file, String folder) throws IOException {
    ensureConfigured();
    String targetFolder = folder == null || folder.isBlank() ? properties.getUploadFolder() : folder;
    String fileName = file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename();

    FileUploadParams params =
        FileUploadParams.builder()
            .file(file.getBytes())
            .fileName(fileName)
            .folder(targetFolder)
            .build();

    FileUploadResponse response = imageKitClient.files().upload(params);

    return ImageKitUploadResponse.builder()
        .fileId(response.fileId().orElse(null))
        .name(response.name().orElse(fileName))
        .url(response.url().orElse(null))
        .thumbnailUrl(response.thumbnailUrl().orElse(null))
        .filePath(response.filePath().orElse(null))
        .fileType(response.fileType().orElse(null))
        .size(response.size().map(Double::longValue).orElse(file.getSize()))
        .build();
  }

  private void ensureConfigured() {
    if (isBlank(properties.getPublicKey())
        || isBlank(properties.getPrivateKey())
        || isBlank(properties.getUrlEndpoint())) {
      throw new IllegalStateException(
          "Missing ImageKit configuration. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT.");
    }
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
