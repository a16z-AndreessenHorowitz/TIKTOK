package com.example.back.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back.repository.VideoRepository;
import com.example.back.repository.VideoScoreDirtyRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoRecommendationScoreService {

  private final VideoRepository videoRepository;
  private final VideoScoreDirtyRepository videoScoreDirtyRepository;

  @Value("${app.video.recommendation-score-batch-size:1000}")
  private int batchSize;

  @Value("${app.video.recommendation-score-max-batches:5}")
  private int maxBatches;

  @Scheduled(fixedRateString = "${app.video.recommendation-score-refresh-ms:300000}")
  @Transactional
  public void refreshRecommendationScores() {
    LocalDateTime cutoff = LocalDateTime.now();
    int refreshedVideos = 0;
    int deletedDirtyRows = 0;

    for (int batch = 0; batch < maxBatches; batch++) {
      List<Long> videoIds = videoScoreDirtyRepository.findDirtyVideoIds(cutoff, batchSize);
      if (videoIds.isEmpty()) {
        break;
      }

      videoIds.forEach(videoRepository::refreshRecommendationScore);
      refreshedVideos += videoIds.size();
      deletedDirtyRows += videoScoreDirtyRepository.deleteProcessedVideoIds(videoIds, cutoff);
    }

    log.debug(
        "Refreshed recommendation scores for {} dirty videos, cleared {} dirty rows",
        refreshedVideos,
        deletedDirtyRows);
  }
}
