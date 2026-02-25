from .pipeline import SafetyCategory, SafetyResult


class ContentClassifier:
    CATEGORIES = {
        "violence": {
            "weapon": 3,
            "kill": 5,
            "murder": 5,
            "assault": 4,
            "attack": 2,
            "fight": 1,
            "harm": 2,
            "hurt": 1,
            "blood": 2,
            "gun": 4,
            "knife": 3,
            "shoot": 4,
            "stab": 4,
            "bomb": 5,
            "explosive": 4,
        },
        "self_harm": {
            "suicide": 5,
            "self-harm": 5,
            "cutting myself": 5,
            "overdose": 4,
            "hurt myself": 5,
            "end my life": 5,
            "don't want to live": 5,
            "kill myself": 5,
            "self injury": 4,
        },
        "explicit": {},
        "drugs_alcohol": {
            "marijuana": 2,
            "cocaine": 4,
            "heroin": 5,
            "meth": 4,
            "drug use": 3,
            "getting high": 3,
            "vaping": 2,
            "opioid": 3,
            "fentanyl": 5,
            "drug dealer": 4,
        },
        "bullying": {
            "bully": 3,
            "harass": 4,
            "intimidate": 3,
            "threaten": 4,
            "cyberbully": 5,
            "humiliate": 3,
        },
    }

    THRESHOLDS = {
        "strict": 3,
        "moderate": 6,
        "standard": 10,
    }

    def __init__(self, safety_level: str = "strict"):
        self.safety_level = safety_level
        self.threshold = self.THRESHOLDS.get(safety_level, self.THRESHOLDS["moderate"])

    def check(self, text: str, direction: str = "output") -> SafetyResult:
        text_lower = text.lower()

        for category, keywords in self.CATEGORIES.items():
            score = sum(weight for keyword, weight in keywords.items() if keyword in text_lower)
            if score >= self.threshold:
                return SafetyResult(
                    passed=False,
                    category=SafetyCategory.INAPPROPRIATE,
                    confidence=min(score / 10.0, 1.0),
                    detail=(
                        f"Content classified as {category} "
                        f"(score: {score}, threshold: {self.threshold})"
                    ),
                    action="blocked",
                )

        return SafetyResult(passed=True, action="allowed")
