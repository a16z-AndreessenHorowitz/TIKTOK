package com.example.back.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.example.back.dto.VideosResponseDTO;

import lombok.RequiredArgsConstructor;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class VideoRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<VideosResponseDTO> getFeed() {
        String sql = "SELECT * FROM videos";

        return jdbcTemplate.query(sql, (rs, rowNum) ->
            VideosResponseDTO.builder()
                .id(rs.getLong("id"))
                .videoUrl(rs.getString("video_url"))
                .build()
        );
    }
}