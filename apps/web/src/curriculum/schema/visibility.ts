import { getAtPath } from "@/curriculum/schema/paths";
import type { UiFieldSpec } from "@/curriculum/schema/types";

export function isFieldVisible(spec: UiFieldSpec, value: unknown): boolean {
  if (!spec.visible_if) {
    return true;
  }

  const rule = spec.visible_if;
  const current = getAtPath(value, rule.path);

  if (rule.exists !== undefined) {
    return rule.exists ? current !== undefined && current !== null && current !== "" : !current;
  }

  if (rule.equals !== undefined) {
    return current === rule.equals;
  }

  if (rule.not_equals !== undefined) {
    return current !== rule.not_equals;
  }

  return true;
}
