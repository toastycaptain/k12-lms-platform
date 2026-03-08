import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 15,
  duration: "45s",
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<900", "p(99)<1500"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";
const SCHOOL_ID = __ENV.SCHOOL_ID || "1";
const SESSION_ID = __ENV.SESSION_ID || "dev";

const QUERIES = [
  "reflection",
  "programme:DP kind:operational_record risk",
  'kind:report "progress snapshot"',
  "family story",
];

export default function () {
  const query = QUERIES[Math.floor(Math.random() * QUERIES.length)];

  const response = http.get(
    `${BASE_URL}/api/v1/ib/search?q=${encodeURIComponent(query)}&limit=8`,
    {
      headers: { "X-School-Id": SCHOOL_ID },
      cookies: { _session_id: SESSION_ID },
    },
  );

  check(response, {
    "search endpoint returned usable response": (res) => res.status === 200 || res.status === 401,
    "search endpoint stayed below 1500ms": (res) => res.timings.duration < 1500,
  });

  sleep(1);
}
