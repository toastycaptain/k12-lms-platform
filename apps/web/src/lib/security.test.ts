import { sanitizeHttpUrl, sanitizeRichTextHtml } from "@/lib/security";

describe("sanitizeHttpUrl", () => {
  it("allows http and https URLs", () => {
    expect(sanitizeHttpUrl("https://example.com/path?q=1")).toBe("https://example.com/path?q=1");
    expect(sanitizeHttpUrl("http://example.com")).toBe("http://example.com/");
  });

  it("rejects non-http protocols and malformed values", () => {
    expect(sanitizeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeHttpUrl("data:text/html;base64,PHNjcmlwdA==")).toBeNull();
    expect(sanitizeHttpUrl("/relative/path")).toBeNull();
    expect(sanitizeHttpUrl("not a url")).toBeNull();
  });
});

describe("sanitizeRichTextHtml", () => {
  it("removes scripts, event handlers, and unsafe links", () => {
    const html =
      '<p onclick="alert(1)">Hello <strong>World</strong> <img src=x onerror=alert(1) /></p>' +
      "<script>alert(1)</script>" +
      '<a href="javascript:alert(1)" target="_blank">bad</a>' +
      '<a href="https://safe.example/path" target="_blank">safe</a>';

    const sanitized = sanitizeRichTextHtml(html);

    expect(sanitized).not.toContain("<script");
    expect(sanitized).not.toContain("onclick=");
    expect(sanitized).not.toContain("onerror=");
    expect(sanitized).not.toContain("javascript:");
    expect(sanitized).toContain("<strong>World</strong>");
    expect(sanitized).toContain('href="https://safe.example/path"');
    expect(sanitized).toContain('rel="noopener noreferrer"');
  });
});
