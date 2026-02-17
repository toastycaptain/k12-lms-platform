import re


class SafetyFilter:
    BLOCKED_PATTERNS = [
        # Direct instruction override
        r"ignore\s+(all\s+)?previous\s+instructions",
        r"ignore\s+(all\s+)?above",
        r"disregard\s+(all\s+)?previous",
        r"forget\s+(all\s+)?(your\s+)?instructions",
        r"override\s+(your\s+)?(system\s+)?prompt",
        # Role-play injection
        r"you\s+are\s+now\s+(?:a|an)\s+(?:evil|malicious)",
        r"pretend\s+you\s+are\s+(?:not\s+)?an?\s+ai",
        r"act\s+as\s+(?:a|an)\s+(?:unrestricted|unfiltered|jailbroken)",
        r"enter\s+(?:developer|debug|god)\s+mode",
        # System prompt extraction
        r"(?:show|reveal|print|output|repeat)\s+(?:your\s+)?system\s+prompt",
        r"what\s+(?:is|are)\s+your\s+(?:system\s+)?instructions",
        r"(?:show|print|output)\s+(?:the\s+)?(?:above|initial)\s+(?:prompt|instructions|text)",
        # Encoding evasion
        r"base64\s*(?:decode|encoded)\s*[:=]",
        # Data exfiltration
        r"(?:send|post|fetch|curl|wget)\s+(?:to|from)\s+(?:https?://|ftp://)",
    ]

    OUTPUT_BLOCKED_PATTERNS = [
        # XSS patterns
        r"<script\b",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe\b",
        r"<object\b",
        r"<embed\b",
        r"data:\s*text/html",
        r"<svg\b[^>]*\bon\w+\s*=",
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
        """Returns (is_safe, rejection_reason)"""
        for pattern in self._compiled_output_patterns:
            if pattern.search(content):
                return False, "Output contains potentially unsafe content"
        return True, None
