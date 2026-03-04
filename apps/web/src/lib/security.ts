const SAFE_HTTP_PROTOCOLS = new Set(["http:", "https:"]);
const SAFE_RICH_TEXT_TAGS = new Set([
  "a",
  "b",
  "br",
  "em",
  "h3",
  "h4",
  "i",
  "li",
  "ol",
  "p",
  "strong",
  "u",
  "ul",
]);
const DROP_RICH_TEXT_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "meta",
  "link",
]);

function sanitizeAnchorHref(rawHref: string): string | null {
  const trimmed = rawHref.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/") || trimmed.startsWith("#")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (!SAFE_HTTP_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeHttpUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!SAFE_HTTP_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeRichTextHtml(rawHtml: string): string {
  const html = rawHtml || "";
  if (typeof DOMParser === "undefined") {
    return html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/\son\w+="[^"]*"/gi, "")
      .replace(/\son\w+='[^']*'/gi, "")
      .replace(/\son\w+=\S+/gi, "");
  }

  const doc = new DOMParser().parseFromString(html, "text/html");

  const sanitizeNode = (node: Node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as Element;
    const tag = element.tagName.toLowerCase();

    if (DROP_RICH_TEXT_TAGS.has(tag)) {
      element.remove();
      return;
    }

    const children = Array.from(element.childNodes);
    for (const child of children) {
      sanitizeNode(child);
    }

    if (!SAFE_RICH_TEXT_TAGS.has(tag)) {
      const parent = element.parentNode;
      if (!parent) {
        element.remove();
        return;
      }
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
      return;
    }

    const attributes = Array.from(element.attributes);
    for (const attribute of attributes) {
      const attrName = attribute.name.toLowerCase();

      if (attrName.startsWith("on") || attrName === "style") {
        element.removeAttribute(attribute.name);
        continue;
      }

      if (tag === "a" && attrName === "href") {
        const safeHref = sanitizeAnchorHref(attribute.value);
        if (!safeHref) {
          element.removeAttribute(attribute.name);
        } else {
          element.setAttribute("href", safeHref);
        }
        continue;
      }

      if (tag === "a" && (attrName === "target" || attrName === "rel")) {
        continue;
      }

      element.removeAttribute(attribute.name);
    }

    if (tag === "a") {
      const href = element.getAttribute("href");
      if (!href) {
        const text = doc.createTextNode(element.textContent || "");
        element.replaceWith(text);
        return;
      }

      const target = element.getAttribute("target");
      if (target === "_blank") {
        element.setAttribute("rel", "noopener noreferrer");
      } else {
        element.removeAttribute("target");
        element.removeAttribute("rel");
      }
    }
  };

  const rootChildren = Array.from(doc.body.childNodes);
  for (const child of rootChildren) {
    sanitizeNode(child);
  }

  return doc.body.innerHTML;
}
