const INLINE_TAGS = new Set(["strong", "em", "u", "code", "a"]);
const BLOCK_TAGS = new Set(["p", "pre", "ul", "ol", "li"]);
const CONTAINER_TAGS = new Set(["div", "span", "section", "article"]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeTagName(tagName: string): string {
  const normalized = tagName.toLowerCase();
  if (normalized === "b") {
    return "strong";
  }
  if (normalized === "i") {
    return "em";
  }
  return normalized;
}

function sanitizeHref(value: string | null): string | undefined {
  const href = value?.trim();
  if (!href) {
    return undefined;
  }

  if (
    href.startsWith("#") ||
    href.startsWith("/") ||
    /^https?:\/\//i.test(href) ||
    /^mailto:/i.test(href) ||
    /^tel:/i.test(href)
  ) {
    return href;
  }

  return undefined;
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as Element;
  const tagName = normalizeTagName(element.tagName);

  if (tagName === "br") {
    return "<br>";
  }

  const children = Array.from(element.childNodes)
    .map((child) => serializeNode(child))
    .join("");

  if (tagName === "a") {
    const safeHref = sanitizeHref(element.getAttribute("href"));
    if (!safeHref) {
      return children;
    }

    return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noreferrer">${children}</a>`;
  }

  if (INLINE_TAGS.has(tagName) || BLOCK_TAGS.has(tagName)) {
    return `<${tagName}>${children}</${tagName}>`;
  }

  if (CONTAINER_TAGS.has(tagName)) {
    return children;
  }

  return children;
}

function cleanSerializedHtml(html: string): string | undefined {
  const normalized = html
    .replace(/(?:<br>\s*){3,}/g, "<br><br>")
    .replace(/\s+<\/(p|li|pre|ul|ol)>/g, "</$1>")
    .replace(/<(p|li|pre|ul|ol)>\s+/g, "<$1>")
    .trim();

  return normalized || undefined;
}

function serializeChildren(root: ParentNode): string | undefined {
  return cleanSerializedHtml(
    Array.from(root.childNodes)
      .map((node) => serializeNode(node))
      .join("")
  );
}

export function extractAllowedRichTextHtml(root: Element | null): string | undefined {
  if (!root) {
    return undefined;
  }

  return serializeChildren(root);
}

export function sanitizeStoredRichTextHtml(html: string | undefined): string | undefined {
  if (!html?.trim()) {
    return undefined;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  return serializeChildren(document.body);
}
