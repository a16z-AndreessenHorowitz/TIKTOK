package com.example.back.service;

import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.example.back.dto.imagekit.ImageKitUploadResponse;
import com.example.back.exception.ImageKitUploadException;

@Service
public class ImageKitService {

  private final RestTemplate restTemplate = new RestTemplate();

  @Value("${app.imagekit.private-key:}")
  private String privateKey;

  @Value("${app.imagekit.upload-endpoint:https://upload.imagekit.io/api/v1/files/upload}")
  private String uploadEndpoint;

  @Value("${app.imagekit.folder:/videos}")
  private String folder;

  public ImageKitUploadResponse upload(MultipartFile file) {
    validateConfig();
    validateFile(file);

    String fileName = buildFileName(file);
    MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
    body.add("file", filePart(file, fileName));
    body.add("fileName", fileName);
    body.add("useUniqueFileName", "true");
    if (StringUtils.hasText(folder)) {
      body.add("folder", folder);
    }

    HttpHeaders headers = new HttpHeaders();
    headers.setBasicAuth(privateKey, "");
    headers.setContentType(MediaType.MULTIPART_FORM_DATA);

    try {
      ResponseEntity<ImageKitUploadResponse> response =
          restTemplate.postForEntity(
              uploadEndpoint, new HttpEntity<>(body, headers), ImageKitUploadResponse.class);

      ImageKitUploadResponse uploaded = response.getBody();
      if (!response.getStatusCode().is2xxSuccessful() || uploaded == null || !StringUtils.hasText(uploaded.getUrl())) {
        throw new ImageKitUploadException("ImageKit upload không trả về URL hợp lệ.");
      }
      return uploaded;
    } catch (HttpStatusCodeException ex) {
      throw new ImageKitUploadException(
          "ImageKit upload thất bại: " + ex.getStatusCode() + " " + ex.getResponseBodyAsString(),
          ex);
    } catch (RestClientException ex) {
      throw new ImageKitUploadException("Không kết nối được ImageKit.", ex);
    }
  }

  private void validateConfig() {
    if (!StringUtils.hasText(privateKey)) {
      throw new ImageKitUploadException("Thiếu app.imagekit.private-key trong application.properties.");
    }
  }

  private static void validateFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new IllegalArgumentException("Không có video để upload.");
    }
    String contentType = Objects.toString(file.getContentType(), "");
    if (!contentType.isBlank() && !contentType.startsWith("video/")) {
      throw new IllegalArgumentException("File upload phải là video.");
    }
  }

  private static HttpEntity<Resource> filePart(MultipartFile file, String fileName) {
    HttpHeaders fileHeaders = new HttpHeaders();
    fileHeaders.setContentDisposition(ContentDisposition.formData().name("file").filename(fileName).build());
    fileHeaders.setContentType(mediaType(file));
    return new HttpEntity<>(file.getResource(), fileHeaders);
  }

  private static MediaType mediaType(MultipartFile file) {
    String contentType = file.getContentType();
    if (!StringUtils.hasText(contentType)) {
      return MediaType.APPLICATION_OCTET_STREAM;
    }
    try {
      return MediaType.parseMediaType(contentType);
    } catch (IllegalArgumentException ex) {
      return MediaType.APPLICATION_OCTET_STREAM;
    }
  }

  private static String buildFileName(MultipartFile file) {
    String original = StringUtils.cleanPath(Objects.toString(file.getOriginalFilename(), "video.mp4"));
    String safe = original.replaceAll("[^a-zA-Z0-9._-]", "_");
    if (!StringUtils.hasText(safe)) {
      safe = "video.mp4";
    }
    return System.currentTimeMillis() + "-" + safe;
  }
}
