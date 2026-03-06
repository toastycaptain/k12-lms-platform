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

export interface AiFieldSuggestion {
  field: string;
  label: string;
  value: string;
  rationale?: string;
}

export interface StructuredAiPlanSuggestion {
  format: "structured" | "legacy";
  programme?: string;
  taskType?: string;
  fields: AiFieldSuggestion[];
}

export interface AiSuggestionDiff {
  field: string;
  label: string;
  previous: string;
  next: string;
  changed: boolean;
  rationale?: string;
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

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
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

function stringifySuggestionValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join("\n");
  }

  if (typeof value === "number") {
    return String(value);
  }

  return typeof value === "string" ? value : "";
}

function normalizeStructuredFieldArray(value: unknown): AiFieldSuggestion[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const field = typeof record.field === "string" ? record.field : null;
    const rawValue = record.value ?? record.next ?? record.proposed_value ?? record.proposal ?? "";

    if (!field) return [];

    return [
      {
        field,
        label:
          typeof record.label === "string" && record.label.trim().length > 0 ? record.label : field,
        value: stringifySuggestionValue(rawValue),
        rationale: typeof record.rationale === "string" ? record.rationale : undefined,
      },
    ];
  });
}

export function parseStructuredAiOutput(text: string): StructuredAiPlanSuggestion | null {
  const parsed = tryParseJson(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  const directFields = normalizeStructuredFieldArray(record.fields);
  const suggestedFields =
    directFields.length > 0
      ? directFields
      : normalizeStructuredFieldArray(
          record.field_suggestions ?? record.suggestions ?? record.changes,
        );

  const objectFields =
    suggestedFields.length === 0 &&
    record.fields &&
    typeof record.fields === "object" &&
    !Array.isArray(record.fields)
      ? Object.entries(record.fields as Record<string, unknown>).map(([field, value]) => ({
          field,
          label: field,
          value: stringifySuggestionValue(value),
        }))
      : [];

  const fields = suggestedFields.length > 0 ? suggestedFields : objectFields;
  if (fields.length === 0) return null;

  return {
    format: "structured",
    programme: typeof record.programme === "string" ? record.programme : undefined,
    taskType: typeof record.task_type === "string" ? record.task_type : undefined,
    fields,
  };
}

export function buildSuggestionDiffs(
  currentValues: Record<string, string>,
  suggestion: StructuredAiPlanSuggestion,
): AiSuggestionDiff[] {
  return suggestion.fields.map((field) => ({
    field: field.field,
    label: field.label,
    previous: currentValues[field.field] || "",
    next: field.value,
    changed: (currentValues[field.field] || "") !== field.value,
    rationale: field.rationale,
  }));
}

export function parseUnitSuggestion(text: string): StructuredAiPlanSuggestion {
  const structured = parseStructuredAiOutput(text);
  if (structured) return structured;

  const unit = parseUnitOutput(text);
  const fields: AiFieldSuggestion[] = [];

  if (unit.description) {
    fields.push({
      field: "description",
      label: "Description",
      value: unit.description,
    });
  }

  if (unit.essential_questions?.length) {
    fields.push({
      field: "essential_questions",
      label: "Essential Questions",
      value: unit.essential_questions.join("\n"),
    });
  }

  if (unit.enduring_understandings?.length) {
    fields.push({
      field: "enduring_understandings",
      label: "Enduring Understandings",
      value: unit.enduring_understandings.join("\n"),
    });
  }

  return {
    format: "legacy",
    fields,
  };
}

export function parseLessonSuggestion(text: string): StructuredAiPlanSuggestion {
  const structured = parseStructuredAiOutput(text);
  if (structured) return structured;

  const lesson = parseLessonOutput(text);
  const fields: AiFieldSuggestion[] = Object.entries(lesson).map(([field, value]) => ({
    field,
    label: field,
    value: stringifySuggestionValue(value),
  }));

  return {
    format: "legacy",
    fields,
  };
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
