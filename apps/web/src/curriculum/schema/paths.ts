function isArrayIndex(segment: string): boolean {
  return /^\d+$/.test(segment);
}

function cloneContainer(value: unknown, nextSegment?: string): unknown {
  if (Array.isArray(value)) {
    return [...value];
  }

  if (value && typeof value === "object") {
    return { ...(value as Record<string, unknown>) };
  }

  return isArrayIndex(nextSegment || "") ? [] : {};
}

export function getAtPath(obj: unknown, path: string): unknown {
  if (!path) {
    return obj;
  }

  return path.split(".").reduce<unknown>((accumulator, segment) => {
    if (accumulator == null) {
      return undefined;
    }

    return (accumulator as Record<string, unknown>)[segment];
  }, obj);
}

export function setAtPath(obj: unknown, path: string, value: unknown): unknown {
  if (!path) {
    return value;
  }

  const parts = path.split(".");
  const root = cloneContainer(obj, parts[0]) as Record<string, unknown> | unknown[];
  let cursor: Record<string, unknown> | unknown[] = root;
  let sourceCursor = (obj ?? {}) as Record<string, unknown> | unknown[];

  for (let index = 0; index < parts.length - 1; index += 1) {
    const segment = parts[index];
    const nextSegment = parts[index + 1];
    const nextSource = (sourceCursor as Record<string, unknown>)[segment];
    const nextValue = cloneContainer(nextSource, nextSegment);

    (cursor as Record<string, unknown>)[segment] = nextValue;
    cursor = nextValue as Record<string, unknown> | unknown[];
    sourceCursor = (nextSource ?? {}) as Record<string, unknown> | unknown[];
  }

  (cursor as Record<string, unknown>)[parts[parts.length - 1]] = value;
  return root;
}

export function deleteAtPath(obj: unknown, path: string): unknown {
  if (!path || obj == null) {
    return obj;
  }

  const parts = path.split(".");
  const root = cloneContainer(obj, parts[0]) as Record<string, unknown> | unknown[];
  let cursor: Record<string, unknown> | unknown[] = root;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const segment = parts[index];
    const currentValue = (cursor as Record<string, unknown>)[segment];
    const nextValue = cloneContainer(currentValue, parts[index + 1]);
    (cursor as Record<string, unknown>)[segment] = nextValue;
    cursor = nextValue as Record<string, unknown> | unknown[];
  }

  if (Array.isArray(cursor)) {
    cursor.splice(Number(parts[parts.length - 1]), 1);
  } else {
    delete (cursor as Record<string, unknown>)[parts[parts.length - 1]];
  }

  return root;
}

export function pointerToDotPath(pointer: string): string {
  return pointer
    .replace(/^#?\//, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
    .join(".");
}
