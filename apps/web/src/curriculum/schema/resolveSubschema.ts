import type { JsonSchema } from "@/curriculum/schema/types";

export function resolveSubschema(root: JsonSchema | undefined, path: string): JsonSchema | null {
  if (!root) {
    return null;
  }

  if (!path) {
    return root;
  }

  return path.split(".").reduce<JsonSchema | null>((schema, segment) => {
    if (!schema) {
      return null;
    }

    if (schema.type === "object" && schema.properties && typeof schema.properties === "object") {
      return ((schema.properties as Record<string, JsonSchema>)[segment] ??
        null) as JsonSchema | null;
    }

    if (schema.type === "array" && schema.items && typeof schema.items === "object") {
      return schema.items as JsonSchema;
    }

    return null;
  }, root);
}
