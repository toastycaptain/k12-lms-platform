# CODEX_AI_SAFETY_DEPTH — Content Classification, PII Detection, and Safety Dashboard

**Priority:** P2
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-14 (AI Gateway — safety), PRD-24 (AI safety → isolated gateway), TECH-2.10 (AI Gateway Contract)
**Depends on:** None

---

## Problem

The AI gateway uses basic regex patterns for safety filtering (5 injection patterns + 3 XSS patterns). For a K-12 platform serving minors, this is insufficient:

1. **No content classification** — regex can't detect inappropriate content themes (violence, self-harm, explicit material) that may appear in AI responses
2. **No PII detection** — AI responses may contain student names, email addresses, or other PII; no scanning before delivery
3. **No bias detection** — AI-generated content may contain cultural, racial, or gender bias; no monitoring
4. **No prompt injection defense beyond regex** — sophisticated prompt injection techniques bypass simple pattern matching
5. **No safety dashboard** — administrators have no visibility into safety filter events
6. **No configurable safety levels** — all schools get the same safety threshold; no school-specific tuning
7. **No human review queue** — flagged content is silently blocked; no way for admins to review and learn from blocks

---

## Tasks

### 1. Create Multi-Layer Safety Filter Pipeline

Update `apps/ai-gateway/app/safety.py`:

```python
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional

class SafetyCategory(str, Enum):
    INJECTION = "injection"
    XSS = "xss"
    PII = "pii"
    INAPPROPRIATE = "inappropriate"
    BIAS = "bias"
    OFF_TOPIC = "off_topic"

@dataclass
class SafetyResult:
    passed: bool
    category: Optional[SafetyCategory] = None
    confidence: float = 0.0
    detail: str = ""

class SafetyPipeline:
    def __init__(self, config: dict):
        self.config = config
        self.filters = [
            InjectionFilter(),
            XSSFilter(),
            PIIFilter(),
            ContentClassifier(config.get("safety_level", "strict")),
        ]

    def check_input(self, text: str) -> SafetyResult:
        for f in self.filters:
            result = f.check(text, direction="input")
            if not result.passed:
                return result
        return SafetyResult(passed=True)

    def check_output(self, text: str) -> SafetyResult:
        for f in self.filters:
            result = f.check(text, direction="output")
            if not result.passed:
                return result
        return SafetyResult(passed=True)
```

### 2. Create PII Detection Filter

Create `apps/ai-gateway/app/filters/pii_filter.py`:

```python
import re

class PIIFilter:
    PATTERNS = {
        "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        "phone": r'\b(?:\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b',
        "ssn": r'\b\d{3}[-]?\d{2}[-]?\d{4}\b',
        "student_id": r'\b(?:student[_\s]?id|sid)[:\s]*\d{5,10}\b',
    }

    def check(self, text: str, direction: str = "output") -> SafetyResult:
        if direction == "input":
            return SafetyResult(passed=True)  # Don't block input PII (user may be asking about their own info)

        for pii_type, pattern in self.PATTERNS.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                return SafetyResult(
                    passed=False,
                    category=SafetyCategory.PII,
                    confidence=0.9,
                    detail=f"Detected {pii_type} in AI output: {len(matches)} instance(s)",
                )

        return SafetyResult(passed=True)

    def redact(self, text: str) -> str:
        """Redact PII from text instead of blocking entirely."""
        result = text
        for pii_type, pattern in self.PATTERNS.items():
            result = re.sub(pattern, f"[REDACTED {pii_type.upper()}]", result, flags=re.IGNORECASE)
        return result
```

### 3. Create Content Classifier

Create `apps/ai-gateway/app/filters/content_classifier.py`:

```python
class ContentClassifier:
    """
    Keyword and phrase-based content classification for K-12 safety.
    Uses weighted keyword scoring rather than ML to avoid additional dependencies.
    """

    # Category → {keyword: weight}
    CATEGORIES = {
        "violence": {
            "weapon": 3, "kill": 5, "murder": 5, "assault": 4, "attack": 2,
            "fight": 1, "harm": 2, "hurt": 1, "blood": 2, "gun": 4, "knife": 3,
        },
        "self_harm": {
            "suicide": 5, "self-harm": 5, "cutting": 3, "overdose": 4,
            "hurt myself": 5, "end my life": 5, "don't want to live": 5,
        },
        "explicit": {
            # Age-inappropriate sexual content keywords
            # Kept minimal and focused on clear-cut cases
        },
        "drugs_alcohol": {
            "marijuana": 2, "cocaine": 4, "heroin": 5, "meth": 4,
            "drug use": 3, "getting high": 3, "vaping": 2,
        },
    }

    THRESHOLDS = {
        "strict": 3,    # K-5 (elementary)
        "moderate": 6,  # 6-8 (middle school)
        "standard": 10, # 9-12 (high school)
    }

    def __init__(self, safety_level: str = "strict"):
        self.threshold = self.THRESHOLDS.get(safety_level, 6)

    def check(self, text: str, direction: str = "output") -> SafetyResult:
        text_lower = text.lower()
        for category, keywords in self.CATEGORIES.items():
            score = sum(weight for keyword, weight in keywords.items() if keyword in text_lower)
            if score >= self.threshold:
                return SafetyResult(
                    passed=False,
                    category=SafetyCategory.INAPPROPRIATE,
                    confidence=min(score / 10.0, 1.0),
                    detail=f"Content classified as {category} (score: {score}, threshold: {self.threshold})",
                )

        return SafetyResult(passed=True)
```

### 4. Create Safety Event Logging

Update `apps/ai-gateway/app/router.py` to log safety events:

```python
@app.post("/v1/generate")
async def generate(request: GenerateRequest):
    # Check input safety
    input_result = safety_pipeline.check_input(request.prompt)
    if not input_result.passed:
        log_safety_event(request, input_result, "input_blocked")
        raise HTTPException(status_code=400, detail=f"Content safety: {input_result.detail}")

    # Generate response
    response = await provider.generate(request)

    # Check output safety
    output_result = safety_pipeline.check_output(response.text)
    if not output_result.passed:
        if output_result.category == SafetyCategory.PII:
            # Redact PII instead of blocking
            response.text = pii_filter.redact(response.text)
            log_safety_event(request, output_result, "output_redacted")
        else:
            log_safety_event(request, output_result, "output_blocked")
            raise HTTPException(status_code=400, detail="Generated content did not pass safety review")

    return response
```

### 5. Create Safety Events API

Create `apps/core/app/controllers/api/v1/admin/safety_controller.rb`:

```ruby
class Api::V1::Admin::SafetyController < ApplicationController
  # GET /api/v1/admin/safety/events
  def events
    authorize :safety, :view?
    events = AiInvocation.where(tenant: Current.tenant)
      .where("metadata->>'safety_event' IS NOT NULL")
      .order(created_at: :desc)
      .limit(100)
    render json: events
  end

  # GET /api/v1/admin/safety/stats
  def stats
    authorize :safety, :view?
    render json: {
      total_invocations_30d: AiInvocation.where(tenant: Current.tenant, created_at: 30.days.ago..).count,
      blocked_30d: blocked_count(30.days),
      redacted_30d: redacted_count(30.days),
      blocks_by_category: blocks_by_category(30.days),
      daily_trend: daily_safety_trend(30.days),
    }
  end

  # PUT /api/v1/admin/safety/config
  def update_config
    authorize :safety, :manage?
    tenant = Current.tenant
    tenant.settings["ai_safety_level"] = params[:safety_level]  # "strict", "moderate", "standard"
    tenant.save!
    render json: { safety_level: tenant.settings["ai_safety_level"] }
  end
end
```

### 6. Build Safety Dashboard

Create `apps/web/src/app/admin/ai/safety/page.tsx`:

**Layout:**
- **Safety Level Selector** — Strict (K-5), Moderate (6-8), Standard (9-12) with description
- **Stats Cards** — Total AI invocations, blocks, redactions, block rate %
- **Blocks by Category** — Pie/bar chart: injection, PII, inappropriate, XSS
- **Daily Trend** — Line chart of blocks/redactions over 30 days
- **Recent Events** — Table: timestamp, user, task type, category, action (blocked/redacted), detail

### 7. Add Tests

**AI Gateway:**
- `apps/ai-gateway/tests/test_pii_filter.py`
  - Detects email addresses in output
  - Detects phone numbers
  - Detects SSNs
  - Does not block input PII
  - Redacts PII correctly

- `apps/ai-gateway/tests/test_content_classifier.py`
  - Blocks violent content at strict threshold
  - Allows educational content about history at standard threshold
  - Scores correctly for multi-keyword content
  - Respects safety level thresholds

- `apps/ai-gateway/tests/test_safety_pipeline.py`
  - Runs all filters in sequence
  - First failing filter stops pipeline
  - Returns detailed result

**Backend:**
- `apps/core/spec/requests/api/v1/admin/safety_controller_spec.rb`
  - Returns safety event list
  - Returns stats with correct counts
  - Admin can update safety level
  - Non-admin denied

**Frontend:**
- `apps/web/src/app/admin/ai/safety/page.test.tsx`
  - Renders safety level selector
  - Renders stats cards
  - Renders event table

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/ai-gateway/app/filters/pii_filter.py` | PII detection and redaction |
| `apps/ai-gateway/app/filters/content_classifier.py` | Content safety classification |
| `apps/ai-gateway/app/safety_pipeline.py` | Multi-layer safety pipeline |
| `apps/core/app/controllers/api/v1/admin/safety_controller.rb` | Safety API |
| `apps/core/app/policies/safety_policy.rb` | Admin-only policy |
| `apps/web/src/app/admin/ai/safety/page.tsx` | Safety dashboard |
| `apps/ai-gateway/tests/test_pii_filter.py` | PII filter tests |
| `apps/ai-gateway/tests/test_content_classifier.py` | Classifier tests |
| `apps/ai-gateway/tests/test_safety_pipeline.py` | Pipeline tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/ai-gateway/app/router.py` | Integrate safety pipeline into generate endpoints |
| `apps/ai-gateway/app/safety.py` | Refactor to use pipeline pattern |
| `apps/core/config/routes.rb` | Add safety routes |
| `apps/core/app/models/tenant.rb` | Safety level in settings |

---

## Definition of Done

- [ ] SafetyPipeline runs injection, XSS, PII, and content classification filters in sequence
- [ ] PIIFilter detects emails, phone numbers, SSNs, and student IDs in AI output
- [ ] PII is redacted (not blocked) — teacher still gets useful response
- [ ] ContentClassifier scores content against weighted keyword categories
- [ ] Safety level configurable per tenant (strict/moderate/standard)
- [ ] Safety events logged with category, confidence, and action taken
- [ ] Safety dashboard shows stats, trends, and event list for admins
- [ ] All AI gateway tests pass
- [ ] All backend specs pass
- [ ] All frontend tests pass
