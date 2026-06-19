package com.example.back.event;

import org.springframework.stereotype.Component;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.binder.MeterBinder;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class VideoCounterQueueMetrics implements MeterBinder {

  private final VideoCounterEventQueue eventQueue;

  @Override
  public void bindTo(MeterRegistry registry) {
    Gauge.builder("app.video_counter.queue.events", eventQueue, VideoCounterEventQueue::queuedEvents)
        .description("Queued video counter events waiting to be aggregated")
        .register(registry);
    Gauge.builder(
            "app.video_counter.queue.pending_keys",
            eventQueue,
            VideoCounterEventQueue::pendingCounterKeys)
        .description("Video counter keys with pending in-memory deltas")
        .register(registry);
    Gauge.builder("app.video_counter.queue.dropped", eventQueue, VideoCounterEventQueue::droppedEvents)
        .description("Dropped video counter events because the in-memory queue was full")
        .register(registry);
  }
}
