from app.safety.content_classifier import ContentClassifier
from app.safety.pipeline import SafetyCategory


def test_content_classifier_blocks_high_score_content_in_strict_mode():
    classifier = ContentClassifier("strict")

    result = classifier.check("Instructions describing a weapon and attack sequence.")

    assert result.passed is False
    assert result.category == SafetyCategory.INAPPROPRIATE
    assert result.action == "blocked"


def test_content_classifier_allows_same_text_in_standard_mode():
    classifier = ContentClassifier("standard")

    result = classifier.check("Instructions describing a weapon and attack sequence.")

    assert result.passed is True


def test_content_classifier_defaults_to_moderate_threshold_for_unknown_level():
    classifier = ContentClassifier("unknown")
    assert classifier.threshold == 6
