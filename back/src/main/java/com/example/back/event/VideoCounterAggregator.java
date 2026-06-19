package com.example.back.event;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.back.repository.VideoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class VideoCounterAggregator {

  private final VideoCounterEventQueue eventQueue;
  private final VideoRepository videoRepository;

  @Value("${app.events.video-counter.max-drain:1000}")
  private int maxDrain;

  @Scheduled(fixedDelayString = "${app.events.video-counter.flush-delay-ms:1000}")
  @Transactional
  public void flush() {
    List<VideoCounterEvent> events = eventQueue.drain(maxDrain);
    if (events.isEmpty()) {
      return;
    }

    Map<VideoCounterKey, Long> deltas = aggregate(events);
    deltas.forEach((key, delta) -> videoRepository.applyCounterDelta(key.type(), key.videoId(), delta));
    eventQueue.markApplied(deltas);

    log.debug("Flushed {} video counter events into {} counter deltas", events.size(), deltas.size());
  }

  private static Map<VideoCounterKey, Long> aggregate(List<VideoCounterEvent> events) {
    Map<VideoCounterKey, Long> deltas = new HashMap<>();
    for (VideoCounterEvent event : events) {
      deltas.merge(new VideoCounterKey(event.type(), event.videoId()), event.delta(), Long::sum);
    }
    deltas.values().removeIf(delta -> delta == 0L);
    return deltas;
  }
}
