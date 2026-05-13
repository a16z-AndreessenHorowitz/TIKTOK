package com.example.back.service.client;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.back.dto.VideosResponseDTO;
import com.example.back.repository.VideoRepository;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class VideoService {
    private final VideoRepository videoRepository;

    public List<VideosResponseDTO> getFeed() {
        return videoRepository.getFeed();
    }
}
