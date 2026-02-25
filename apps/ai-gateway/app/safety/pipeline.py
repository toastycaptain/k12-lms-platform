from dataclasses import dataclass
from enum import StrEnum


class SafetyCategory(StrEnum):
    INJECTION = "injection"
    XSS = "xss"
    PII = "pii"
    INAPPROPRIATE = "inappropriate"
    BIAS = "bias"
    OFF_TOPIC = "off_topic"


@dataclass
class SafetyResult:
    passed: bool
    category: SafetyCategory | None = None
    confidence: float = 0.0
    detail: str = ""
    action: str = ""


class SafetyPipeline:
    def __init__(self, filters: list | None = None):
        self.filters = filters or []

    def add_filter(self, filter_instance) -> None:
        self.filters.append(filter_instance)

    def check_input(self, text: str) -> SafetyResult:
        for filter_instance in self.filters:
            result = filter_instance.check(text, direction="input")
            if not result.passed:
                result.action = "blocked"
                return result

        return SafetyResult(passed=True, action="allowed")

    def check_output(self, text: str) -> SafetyResult:
        for filter_instance in self.filters:
            result = filter_instance.check(text, direction="output")
            if not result.passed:
                return result

        return SafetyResult(passed=True, action="allowed")
