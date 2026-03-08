import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.PHASE11_API_BASE_URL || "http://localhost:4000";
const schoolId = __ENV.PHASE11_SCHOOL_ID || "1";
const headers = { "X-School-Id": schoolId };

export const options = {
  thresholds: {
    http_req_failed: ["rate<0.03"],
    http_req_duration: ["p(95)<1200"],
  },
  scenarios: {
    workload: {
      executor: "per-vu-iterations",
      vus: Number(__ENV.PHASE11_VUS || 5),
      iterations: Number(__ENV.PHASE11_ITERATIONS || 20),
      maxDuration: __ENV.PHASE11_MAX_DURATION || "2m",
    },
  },
};

const requests = [
  {
    "name": "reports",
    "path": "/api/v1/ib/reports",
    "method": "GET",
    "roleKey": "dp_subject_teacher"
  },
  {
    "name": "search",
    "path": "/api/v1/ib/search?q=reflection",
    "method": "GET",
    "roleKey": "ib_director"
  },
  {
    "name": "operations",
    "path": "/api/v1/ib/operations",
    "method": "GET",
    "roleKey": "ib_director"
  }
];

export default function () {
  requests.forEach((request) => {
    const response = http.get(baseUrl + request.path, { headers });
    check(response, { ["reporting-search-queue" + " " + request.name]: (result) => result.status < 500 });
  });
  sleep(1);
}
