import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 20 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<750"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const ACCESS_TOKEN = __ENV.ACCESS_TOKEN || "";

function authHeaders() {
  return ACCESS_TOKEN ? { Authorization: `Bearer ${ACCESS_TOKEN}` } : {};
}

function readItems(response) {
  try {
    const payload = JSON.parse(response.body);
    return Array.isArray(payload?.data?.items) ? payload.data.items : [];
  } catch {
    return [];
  }
}

export default function () {
  const feed = http.get(`${BASE_URL}/api/v1/videos/feed?limit=8`, {
    headers: authHeaders(),
  });

  check(feed, {
    "feed status is 200": (response) => response.status === 200,
  });

  const items = readItems(feed);
  if (ACCESS_TOKEN && items.length > 0) {
    const viewItems = items.slice(0, 4).map((item) => ({
      videoId: item.id,
      watchTime: 8,
    }));

    const viewBatch = http.post(
      `${BASE_URL}/api/v1/videos/interactions/view/batch`,
      JSON.stringify({ items: viewItems }),
      {
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
      },
    );

    check(viewBatch, {
      "view batch accepted": (response) => response.status === 201,
    });
  }

  sleep(1);
}
