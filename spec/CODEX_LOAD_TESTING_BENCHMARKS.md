# CODEX_LOAD_TESTING_BENCHMARKS — Performance Benchmarks and Load Testing Framework

**Priority:** P2
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-23 (Performance, Reliability), PRD-8 (Drive attach < 30s — performance targets)
**Depends on:** None

---

## Problem

The platform has no load testing infrastructure. Before wider rollout to multiple schools, there is no evidence that the system can handle realistic K-12 traffic patterns:

1. **No load test suite** — no automated performance tests exist
2. **No baseline benchmarks** — no documented response time expectations per endpoint
3. **No concurrency testing** — unknown behavior under 50, 100, 500 concurrent users
4. **No peak scenario testing** — K-12 has distinct peak patterns (school opening day, exam week, grading deadlines, report card day) that stress specific subsystems
5. **No database query performance benchmarks** — N+1 detection was added in Batch 5 but no baseline query counts/times established
6. **No AI gateway throughput testing** — unknown concurrent AI generation capacity
7. **No degradation thresholds** — no defined limits for when the system should trigger alerts or scale

---

## Tasks

### 1. Install K6 Load Testing Framework

Add K6 configuration to the project:

Create `apps/load-tests/package.json`:
```json
{
  "name": "@k12/load-tests",
  "private": true,
  "scripts": {
    "test:smoke": "k6 run --env ENV=staging scenarios/smoke.js",
    "test:load": "k6 run --env ENV=staging scenarios/load.js",
    "test:stress": "k6 run --env ENV=staging scenarios/stress.js",
    "test:spike": "k6 run --env ENV=staging scenarios/spike.js",
    "test:soak": "k6 run --env ENV=staging scenarios/soak.js"
  }
}
```

### 2. Create K6 Helper Library

Create `apps/load-tests/lib/helpers.js`:

```javascript
import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_URL = __ENV.API_URL || "http://localhost:4000";

export function login(email, password) {
  // Authenticate and return session cookie
  const res = http.post(`${API_URL}/api/v1/auth/login`, JSON.stringify({ email, password }), {
    headers: { "Content-Type": "application/json" },
  });
  check(res, { "login successful": (r) => r.status === 200 });
  return res.cookies;
}

export function apiGet(path, cookies) {
  return http.get(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    cookies: cookies,
  });
}

export function apiPost(path, body, cookies) {
  return http.post(`${API_URL}${path}`, JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    cookies: cookies,
  });
}

export function checkResponse(res, name) {
  check(res, {
    [`${name} status 200`]: (r) => r.status === 200,
    [`${name} < 500ms`]: (r) => r.timings.duration < 500,
    [`${name} < 1s`]: (r) => r.timings.duration < 1000,
  });
}
```

### 3. Create Smoke Test Scenario

Create `apps/load-tests/scenarios/smoke.js`:

```javascript
import { sleep } from "k6";
import { login, apiGet, checkResponse } from "../lib/helpers.js";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const cookies = login("teacher@test.local", "password");

  // Core teacher workflow
  checkResponse(apiGet("/api/v1/me", cookies), "me");
  checkResponse(apiGet("/api/v1/unit_plans", cookies), "unit_plans");
  checkResponse(apiGet("/api/v1/courses", cookies), "courses");
  checkResponse(apiGet("/api/v1/notifications?unread=true", cookies), "notifications");

  sleep(1);
}
```

### 4. Create Realistic Load Scenarios

Create `apps/load-tests/scenarios/load.js` — Normal school day traffic:

```javascript
export const options = {
  scenarios: {
    teachers_browsing: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 30 },   // Ramp to 30 teachers
        { duration: "5m", target: 30 },   // Hold at 30
        { duration: "2m", target: 0 },    // Ramp down
      ],
      exec: "teacherBrowsing",
    },
    students_submitting: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 100 },  // Ramp to 100 students
        { duration: "5m", target: 100 },  // Hold at 100
        { duration: "2m", target: 0 },    // Ramp down
      ],
      exec: "studentSubmitting",
    },
    admins: {
      executor: "constant-vus",
      vus: 3,
      duration: "9m",
      exec: "adminOperations",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
    http_req_failed: ["rate<0.05"],
  },
};
```

Define functions for each persona:
- `teacherBrowsing()` — View dashboard → browse units → open unit → view gradebook → check notifications
- `studentSubmitting()` — View dashboard → open course → view assignment → submit work → check grades
- `adminOperations()` — View analytics → browse users → check integrations

### 5. Create Peak Scenario: Concurrent Quiz Attempt

Create `apps/load-tests/scenarios/concurrent-quiz.js`:

Simulates a class of 35 students all starting a quiz simultaneously:

```javascript
export const options = {
  scenarios: {
    quiz_start: {
      executor: "shared-iterations",
      vus: 35,
      iterations: 35,
      maxDuration: "5m",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const cookies = login(studentEmail(), "password");
  // Start quiz attempt
  checkResponse(apiPost(`/api/v1/quizzes/${QUIZ_ID}/attempts`, {}, cookies), "start_attempt");
  // Answer 20 questions
  for (let i = 0; i < 20; i++) {
    sleep(Math.random() * 3 + 2); // 2-5 seconds per question
    checkResponse(apiPost(`/api/v1/attempts/${ATTEMPT_ID}/answers`, { question_id: i, answer: "A" }, cookies), "answer");
  }
  // Submit
  checkResponse(apiPost(`/api/v1/attempts/${ATTEMPT_ID}/submit`, {}, cookies), "submit");
}
```

### 6. Create Peak Scenario: Grading Rush

Create `apps/load-tests/scenarios/grading-rush.js`:

Simulates 20 teachers grading submissions at end of term:

```javascript
export const options = {
  scenarios: {
    grading: {
      executor: "constant-vus",
      vus: 20,
      duration: "10m",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1000"],
    http_req_failed: ["rate<0.02"],
  },
};

export default function () {
  const cookies = login(teacherEmail(), "password");
  // Load gradebook
  checkResponse(apiGet(`/api/v1/courses/${COURSE_ID}/gradebook`, cookies), "gradebook");
  // Grade 10 submissions
  for (let i = 0; i < 10; i++) {
    sleep(Math.random() * 5 + 3); // 3-8 seconds per grade
    checkResponse(apiPost(`/api/v1/submissions/${submissionId()}/grade`, {
      grade: Math.floor(Math.random() * 40 + 60),
      feedback: "Good work. See comments."
    }, cookies), "grade_submission");
  }
}
```

### 7. Create Peak Scenario: School Opening Day

Create `apps/load-tests/scenarios/opening-day.js`:

Simulates first day of school: admin creates courses, teachers set up, students enroll.

```javascript
export const options = {
  scenarios: {
    admin_setup: { executor: "constant-vus", vus: 2, duration: "5m", exec: "adminSetup" },
    teacher_setup: { executor: "ramping-vus", startVUs: 0, stages: [{ duration: "3m", target: 20 }, { duration: "2m", target: 20 }], exec: "teacherSetup" },
    student_flood: { executor: "ramping-vus", startVUs: 0, stages: [{ duration: "1m", target: 50 }, { duration: "2m", target: 200 }, { duration: "2m", target: 200 }], exec: "studentLogin" },
  },
};
```

### 8. Create AI Gateway Load Test

Create `apps/load-tests/scenarios/ai-gateway.js`:

Test concurrent AI generation requests:

```javascript
export const options = {
  scenarios: {
    ai_generation: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 5 },
        { duration: "3m", target: 15 },
        { duration: "1m", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<10000"],  // AI generation can be slow
    http_req_failed: ["rate<0.10"],       // Allow higher failure rate for rate-limited AI
  },
};
```

### 9. Define Performance Baseline Document

Create `docs/PERFORMANCE_BASELINES.md`:

```markdown
# Performance Baselines

## API Response Time Targets

| Endpoint Category | p50 | p95 | p99 |
|-------------------|-----|-----|-----|
| Auth (login, me) | < 100ms | < 300ms | < 500ms |
| List endpoints (index) | < 200ms | < 500ms | < 1s |
| Detail endpoints (show) | < 100ms | < 300ms | < 500ms |
| Create/Update | < 200ms | < 500ms | < 1s |
| Gradebook (computed) | < 500ms | < 1s | < 2s |
| Analytics (aggregated) | < 1s | < 3s | < 5s |
| AI Generation | < 5s | < 10s | < 15s |
| Search (FTS) | < 200ms | < 500ms | < 1s |
| File upload | < 1s | < 3s | < 5s |

## Concurrency Targets

| Scenario | Target VUs | Pass Criteria |
|----------|-----------|---------------|
| Normal school day | 130 (30 teachers + 100 students) | p95 < 1s, error rate < 5% |
| Concurrent quiz | 35 students | p95 < 2s, error rate < 1% |
| Grading rush | 20 teachers | p95 < 1s, error rate < 2% |
| Opening day | 200+ users | p95 < 2s, error rate < 5% |
| AI concurrent | 15 teachers | p95 < 10s, error rate < 10% |
```

### 10. Create CI Integration

Create `apps/load-tests/ci/smoke.sh`:
- Run smoke test as part of staging deploy pipeline
- Fail deployment if smoke test thresholds are violated
- Output results as JSON for historical tracking

Update `.github/workflows/deploy.yml`:
- Add post-deploy step that runs smoke test against staging URL
- Fail pipeline if critical thresholds exceeded

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/load-tests/package.json` | Load test package config |
| `apps/load-tests/lib/helpers.js` | K6 helper functions |
| `apps/load-tests/scenarios/smoke.js` | Basic endpoint smoke test |
| `apps/load-tests/scenarios/load.js` | Normal school day load test |
| `apps/load-tests/scenarios/concurrent-quiz.js` | Quiz concurrency test |
| `apps/load-tests/scenarios/grading-rush.js` | Grading peak test |
| `apps/load-tests/scenarios/opening-day.js` | Opening day spike test |
| `apps/load-tests/scenarios/ai-gateway.js` | AI gateway throughput test |
| `apps/load-tests/ci/smoke.sh` | CI smoke test runner |
| `docs/PERFORMANCE_BASELINES.md` | Target response times and concurrency |

## Files to Modify

| File | Purpose |
|------|---------|
| `package.json` | Add load-tests to workspaces |
| `.github/workflows/deploy.yml` | Add post-deploy smoke test step |

---

## Definition of Done

- [ ] K6 installed and configured in load-tests workspace
- [ ] Helper library provides login, apiGet, apiPost, and checkResponse utilities
- [ ] Smoke test verifies all critical endpoints respond < 500ms
- [ ] Normal school day scenario handles 130 concurrent users
- [ ] Concurrent quiz scenario handles 35 simultaneous students
- [ ] Grading rush scenario handles 20 teachers grading simultaneously
- [ ] Opening day scenario handles 200+ users with mixed operations
- [ ] AI gateway test measures generation throughput under load
- [ ] Performance baselines documented with p50/p95/p99 targets
- [ ] Smoke test integrated into CI deploy pipeline
- [ ] All test scenarios run without errors against staging
