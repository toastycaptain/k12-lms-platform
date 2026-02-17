import { parseLessonOutput, parseUnitOutput } from "@/lib/ai-output-parser";

describe("ai-output-parser", () => {
  it("parses lesson output sections with markdown headings", () => {
    const output = `
## Objectives
- Students compare fractions.

## Activities
1. Mini-lesson
2. Guided practice

## Materials
- Fraction strips
- Whiteboards

## Duration
45 minutes
`;

    expect(parseLessonOutput(output)).toEqual({
      objectives: "- Students compare fractions.",
      activities: "1. Mini-lesson\n2. Guided practice",
      materials: "- Fraction strips\n- Whiteboards",
      duration_minutes: 45,
    });
  });

  it("parses unit output into description and list fields", () => {
    const output = `
Description:
This unit builds conceptual understanding for fraction operations.

Essential Questions:
- How can models support fraction reasoning?
- When are fractions equivalent?

Enduring Understandings:
- Fractions can represent relationships and quantities.
- Equivalent fractions name the same amount.
`;

    expect(parseUnitOutput(output)).toEqual({
      description: "This unit builds conceptual understanding for fraction operations.",
      essential_questions: [
        "How can models support fraction reasoning?",
        "When are fractions equivalent?",
      ],
      enduring_understandings: [
        "Fractions can represent relationships and quantities.",
        "Equivalent fractions name the same amount.",
      ],
    });
  });

  it("falls back to raw text when no headings are present", () => {
    expect(parseLessonOutput("Use partner discourse and quick checks.")).toEqual({
      activities: "Use partner discourse and quick checks.",
    });
    expect(parseUnitOutput("A short unit overview.")).toEqual({
      description: "A short unit overview.",
    });
  });
});
