import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1200"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";

export default function () {
  const responses = [
    http.get(`${BASE_URL}/api/v1/health`),
    http.get(`${BASE_URL}/api/v1/ib/job_operations`, {
      headers: { "X-School-Id": __ENV.SCHOOL_ID || "1" },
      cookies: { _session_id: __ENV.SESSION_ID || "dev" },
    }),
  ];

  responses.forEach((response) => {
    check(response, {
      "status is acceptable": (r) => r.status === 200 || r.status === 401,
    });
  });

  sleep(1);
}
