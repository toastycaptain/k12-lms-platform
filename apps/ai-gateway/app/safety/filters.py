import re


class SafetyFilter:
    BLOCKED_PATTERNS = [
        r"ignore\s+(all\s+)?previous\s+instructions",
        r"ignore\s+(all\s+)?above",
        r"disregard\s+(all\s+)?previous",
        r"you\s+are\s+now\s+(?:a|an)\s+(?:evil|malicious)",
        r"pretend\s+you\s+are\s+(?:not\s+)?an?\s+ai",
    ]

    def check_input(self, prompt: str, task_type: str | None = None) -> tuple[bool, str | None]:
        """Returns (is_safe, rejection_reason)"""
        for pattern in self.BLOCKED_PATTERNS:
            if re.search(pattern, prompt, re.IGNORECASE):
                return False, "Input rejected: potentially unsafe content detected"
        return True, None

    def check_output(self, content: str, task_type: str | None = None) -> tuple[bool, str | None]:
        blocked_patterns = [
            r"<script\b",
            r"javascript:",
            r"on\w+\s*=",
        ]
        content_lower = content.lower()
        for pattern in blocked_patterns:
            if re.search(pattern, content_lower):
                return False, "Output contains potentially unsafe content"
        return True, None
