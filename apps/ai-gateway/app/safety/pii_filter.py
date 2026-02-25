import re

from .pipeline import SafetyCategory, SafetyResult


class PIIFilter:
    PATTERNS = {
        "email": re.compile(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", re.IGNORECASE
        ),
        "phone": re.compile(r"\b(?:\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b"),
        "ssn": re.compile(r"\b\d{3}[-]?\d{2}[-]?\d{4}\b"),
        "student_id": re.compile(
            r"\b(?:student[_\s]?id|sid)[:\s]*\d{5,10}\b", re.IGNORECASE
        ),
    }

    def check(self, text: str, direction: str = "output") -> SafetyResult:
        if direction == "input":
            return SafetyResult(passed=True, action="allowed")

        for pii_type, pattern in self.PATTERNS.items():
            matches = pattern.findall(text)
            if matches:
                return SafetyResult(
                    passed=False,
                    category=SafetyCategory.PII,
                    confidence=0.9,
                    detail=f"Detected {pii_type} in AI output: {len(matches)} instance(s)",
                    action="redacted",
                )

        return SafetyResult(passed=True, action="allowed")

    def redact(self, text: str) -> str:
        redacted = text
        for pii_type, pattern in self.PATTERNS.items():
            redacted = pattern.sub(f"[REDACTED {pii_type.upper()}]", redacted)
        return redacted
