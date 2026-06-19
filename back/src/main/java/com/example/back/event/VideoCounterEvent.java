package com.example.back.event;

public record VideoCounterEvent(VideoCounterType type, long videoId, long delta) {}
