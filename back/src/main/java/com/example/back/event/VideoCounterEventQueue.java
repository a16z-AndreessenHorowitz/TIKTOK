package com.example.back.event;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class VideoCounterEventQueue {

  private final BlockingQueue<VideoCounterEvent> queue;
  private final Map<VideoCounterKey, AtomicLong> pendingDeltas = new ConcurrentHashMap<>();
  private final AtomicLong droppedEvents = new AtomicLong();

  public VideoCounterEventQueue(
      @Value("${app.events.video-counter.queue-capacity:100000}") int capacity) {
    this.queue = new LinkedBlockingQueue<>(Math.max(1, capacity));
  }

  public boolean publish(VideoCounterType type, long videoId, long delta) {
    if (videoId <= 0 || delta == 0) {
      return false;
    }

    VideoCounterEvent event = new VideoCounterEvent(type, videoId, delta);
    VideoCounterKey key = new VideoCounterKey(type, videoId);
    applyPendingDelta(key, delta);

    boolean accepted = queue.offer(event);
    if (!accepted) {
      applyPendingDelta(key, -delta);
      droppedEvents.incrementAndGet();
      return false;
    }
    return true;
  }

  public List<VideoCounterEvent> drain(int maxEvents) {
    if (maxEvents <= 0) {
      return List.of();
    }

    List<VideoCounterEvent> events = new ArrayList<>(maxEvents);
    queue.drainTo(events, maxEvents);
    return events;
  }

  public void markApplied(Map<VideoCounterKey, Long> appliedDeltas) {
    appliedDeltas.forEach(
        (key, delta) -> {
          applyPendingDelta(key, -delta);
        });
  }

  public long projectedCount(VideoCounterType type, long videoId, long storedCount) {
    AtomicLong pending = pendingDeltas.get(new VideoCounterKey(type, videoId));
    long pendingDelta = pending != null ? pending.get() : 0L;
    return Math.max(0L, storedCount + pendingDelta);
  }

  public int queuedEvents() {
    return queue.size();
  }

  public int pendingCounterKeys() {
    return pendingDeltas.size();
  }

  public long droppedEvents() {
    return droppedEvents.get();
  }

  private void applyPendingDelta(VideoCounterKey key, long delta) {
    AtomicLong pending = pendingDeltas.computeIfAbsent(key, ignored -> new AtomicLong());
    long remaining = pending.addAndGet(delta);
    if (remaining == 0) {
      pendingDeltas.remove(key, pending);
    }
  }
}
