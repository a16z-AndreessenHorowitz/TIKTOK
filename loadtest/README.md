# Load Test

Run this after the backend is up:

```bash
k6 run loadtest/k6-feed.js
```

With an authenticated user, include an access token so the script also sends view batches:

```bash
BASE_URL=http://localhost:8080 ACCESS_TOKEN=your_access_jwt k6 run loadtest/k6-feed.js
```

Useful local actuator endpoints:

```text
/actuator/health
/actuator/metrics
/actuator/metrics/app.video_counter.queue.events
/actuator/metrics/app.video_counter.queue.pending_keys
/actuator/metrics/app.video_counter.queue.dropped
```
