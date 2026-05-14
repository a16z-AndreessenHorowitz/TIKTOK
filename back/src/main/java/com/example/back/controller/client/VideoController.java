package com.example.back.controller.client;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.back.dto.ApiResponse;
import com.example.back.dto.VideosResponseDTO;
import com.example.back.service.client.VideoService;

import lombok.RequiredArgsConstructor;
import java.util.*;

@RestController
@RequestMapping("/api/v1/videos")
@RequiredArgsConstructor
public class VideoController {

  private final VideoService videoService;

  @GetMapping("/feed")
  public ApiResponse<List<VideosResponseDTO>> getVideoFeed() {
    return ApiResponse.of(200, "Success", videoService.getFeed());
  }
}
