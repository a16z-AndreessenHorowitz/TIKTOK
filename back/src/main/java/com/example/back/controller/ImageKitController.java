package com.example.back.controller;

import java.io.IOException;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.back.dto.ApiResponse;
import com.example.back.dto.imagekit.ImageKitAuthResponse;
import com.example.back.dto.imagekit.ImageKitUploadResponse;
import com.example.back.service.ImageKitService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/imagekit")
@RequiredArgsConstructor
public class ImageKitController {

  private final ImageKitService imageKitService;

  @GetMapping("/auth")
  public ApiResponse<ImageKitAuthResponse> getAuthParameters() {
    return ApiResponse.of(200, "Success", imageKitService.getAuthenticationParameters());
  }

  @PostMapping("/upload")
  public ApiResponse<ImageKitUploadResponse> upload(
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "folder", required = false) String folder)
      throws IOException {
    return ApiResponse.of(201, "Uploaded", imageKitService.upload(file, folder));
  }
}
