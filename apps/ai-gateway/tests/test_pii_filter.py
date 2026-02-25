from app.safety.pii_filter import PIIFilter
from app.safety.pipeline import SafetyCategory


def test_pii_filter_allows_input_direction():
    pii_filter = PIIFilter()

    result = pii_filter.check("My email is teacher@example.org", direction="input")

    assert result.passed is True


def test_pii_filter_detects_output_pii():
    pii_filter = PIIFilter()

    result = pii_filter.check("Student ID: 123456 and email x@y.com", direction="output")

    assert result.passed is False
    assert result.category == SafetyCategory.PII
    assert result.action == "redacted"


def test_pii_filter_redacts_multiple_types():
    pii_filter = PIIFilter()

    redacted = pii_filter.redact("Email test@example.com Phone 555-123-4567")

    assert "[REDACTED EMAIL]" in redacted
    assert "[REDACTED PHONE]" in redacted
