import { pointerToDotPath } from "@/curriculum/schema/paths";

interface SchemaErrorRow {
  message?: string;
  error?: string;
  pointer?: string;
  data_pointer?: string;
}

export function extractSchemaErrors(payload: unknown): Record<string, string> {
  const details =
    payload && typeof payload === "object" && "details" in payload
      ? (payload as { details?: unknown }).details
      : payload;

  const rows = Array.isArray(details)
    ? details
    : details &&
        typeof details === "object" &&
        "errors" in details &&
        Array.isArray((details as { errors?: unknown[] }).errors)
      ? (details as { errors: unknown[] }).errors
      : [];

  return rows.reduce<Record<string, string>>((accumulator, row) => {
    if (!row || typeof row !== "object") {
      return accumulator;
    }

    const entry = row as SchemaErrorRow;
    const pointer = entry.pointer || entry.data_pointer;
    const path = pointer ? pointerToDotPath(pointer) : "";
    const message = entry.message || entry.error || "Invalid value";

    accumulator[path] = message;
    return accumulator;
  }, {});
}
