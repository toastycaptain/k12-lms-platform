export interface LessonPlanOutput {
  objectives?: string;
  activities?: string;
  materials?: string;
  assessment_notes?: string;
  duration_minutes?: number;
}

export interface UnitPlanOutput {
  description?: string;
  essential_questions?: string[];
  enduring_understandings?: string[];
}

const LESSON_HEADINGS: Record<string, keyof LessonPlanOutput> = {
  objectives: "objectives",
  objective: "objectives",
  activities: "activities",
  activity: "activities",
  materials: "materials",
  material: "materials",
  "assessment notes": "assessment_notes",
  assessment: "assessment_notes",
  duration: "duration_minutes",
  "duration minutes": "duration_minutes",
};

const UNIT_HEADINGS: Record<string, keyof UnitPlanOutput> = {
  description: "description",
  "essential questions": "essential_questions",
  "essential question": "essential_questions",
  "enduring understandings": "enduring_understandings",
  "enduring understanding": "enduring_understandings",
};

function normalizeHeading(raw: string): string {
  return raw
    .replace(/^#+\s*/, "")
    .replace(/:\s*$/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeLineValue(value: string): string {
  return value.replace(/^\s*(?:[-*+]|\d+[.)])\s*/, "").trim();
}

function parseSections<T extends string>(
  text: string,
  headingMap: Record<string, T>,
): Record<T, string> {
  const sections: Partial<Record<T, string[]>> = {};
  let activeKey: T | null = null;

  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    const normalized = normalizeHeading(trimmed);
    const matchedKey = headingMap[normalized];

    if (matchedKey) {
      activeKey = matchedKey;
      if (!sections[activeKey]) {
        sections[activeKey] = [];
      }
      return;
    }

    if (!activeKey) return;
    sections[activeKey]?.push(line);
  });

  const entries = Object.entries(sections) as Array<[T, string[] | undefined]>;

  return Object.fromEntries(
    entries
      .map(([key, lines]) => [key, (lines || []).join("\n").trim()])
      .filter(([, value]) => Boolean(value)),
  ) as Record<T, string>;
}

function parseList(content: string): string[] {
  if (!content.trim()) return [];

  return content
    .split(/\r?\n/)
    .map((line) => normalizeLineValue(line))
    .filter((line) => Boolean(line));
}

function parseDuration(content: string): number | undefined {
  const match = content.match(/(\d{1,3})\s*(?:minutes?|mins?|min)?/i);
  if (!match) return undefined;

  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : undefined;
}

export function parseLessonOutput(text: string): LessonPlanOutput {
  const sections = parseSections(text, LESSON_HEADINGS);
  const parsed: LessonPlanOutput = {};

  if (sections.objectives) parsed.objectives = sections.objectives;
  if (sections.activities) parsed.activities = sections.activities;
  if (sections.materials) parsed.materials = sections.materials;
  if (sections.assessment_notes) parsed.assessment_notes = sections.assessment_notes;

  const durationSource = sections.duration_minutes || text;
  const duration = parseDuration(durationSource);
  if (duration !== undefined) {
    parsed.duration_minutes = duration;
  }

  if (Object.keys(parsed).length === 0 && text.trim()) {
    parsed.activities = text.trim();
  }

  return parsed;
}

export function parseUnitOutput(text: string): UnitPlanOutput {
  const sections = parseSections(text, UNIT_HEADINGS);
  const parsed: UnitPlanOutput = {};

  if (sections.description) {
    parsed.description = sections.description;
  }

  if (sections.essential_questions) {
    parsed.essential_questions = parseList(sections.essential_questions);
  }

  if (sections.enduring_understandings) {
    parsed.enduring_understandings = parseList(sections.enduring_understandings);
  }

  if (Object.keys(parsed).length === 0 && text.trim()) {
    parsed.description = text.trim();
  }

  return parsed;
}
