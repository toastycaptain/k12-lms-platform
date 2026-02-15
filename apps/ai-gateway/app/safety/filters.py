import re


class SafetyFilter:
    BLOCKED_PATTERNS = [
        r"ignore\s+(all\s+)?previous\s+instructions",
        r"ignore\s+(all\s+)?above",
        r"disregard\s+(all\s+)?previous",
        r"you\s+are\s+now\s+(?:a|an)\s+(?:evil|malicious)",
        r"pretend\s+you\s+are\s+(?:not\s+)?an?\s+ai",
    ]
    OUTPUT_BLOCKED_PATTERNS = [
        r"<script\b",
        r"javascript:",
        r"on\w+\s*=",
    ]
    _compiled_input_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in BLOCKED_PATTERNS]
    _compiled_output_patterns = [
        re.compile(pattern, re.IGNORECASE) for pattern in OUTPUT_BLOCKED_PATTERNS
    ]

    def check_input(self, prompt: str, task_type: str | None = None) -> tuple[bool, str | None]:
        """Returns (is_safe, rejection_reason)"""
        for pattern in self._compiled_input_patterns:
            if pattern.search(prompt):
                return False, "Input rejected: potentially unsafe content detected"
        return True, None

    def check_output(self, content: str, task_type: str | None = None) -> tuple[bool, str | None]:
        for pattern in self._compiled_output_patterns:
            if pattern.search(content):
                return False, "Output contains potentially unsafe content"
        return True, None
