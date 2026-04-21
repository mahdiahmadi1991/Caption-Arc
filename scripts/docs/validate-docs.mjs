import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const DOCS_ROOT = "docs";

const ALLOWED_ROOT_MARKDOWN = new Set([
  "README.md",
  "AGENTS.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
]);

const ALLOWED_NON_DOC_MARKDOWN_PATTERNS = [
  /^\.github\/copilot-instructions\.md$/u,
  /^\.github\/instructions\/[a-z0-9-]+\.instructions\.md$/u,
  /^\.secrets\/README\.md$/u,
];

const REQUIRED_SECTION_INDEXES = [
  "docs/README.md",
  "docs/architecture/README.md",
  "docs/architecture/diagrams/README.md",
  "docs/product/README.md",
  "docs/setup/README.md",
  "docs/features/README.md",
  "docs/features/background/README.md",
  "docs/features/content-scripts/README.md",
  "docs/features/ui/README.md",
  "docs/features/integrations/README.md",
  "docs/features/plans/README.md",
  "docs/api/README.md",
  "docs/quality/README.md",
  "docs/quality/testing-strategy.md",
  "docs/quality/testing-quality-gate.md",
  "docs/quality/testing-onboarding.md",
  "docs/security/README.md",
  "docs/operations/README.md",
  "docs/contributing/README.md",
  "docs/contributing/execution-plans.md",
  "docs/contributing/execution-plans/README.md",
  "docs/contributing/execution-plans/active/README.md",
  "docs/contributing/execution-plans/completed/README.md",
  "docs/adr/README.md",
  "docs/templates/README.md",
  "docs/templates/execution-plan-template.md",
  "docs/archive/README.md",
  "docs/archive/feature-plans/README.md",
];

const SENSITIVE_PATTERNS = [
  { label: "OpenAI secret key", regex: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { label: "GitHub personal token", regex: /\bghp_[A-Za-z0-9]{20,}\b/g },
  { label: "Slack token", regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { label: "Google API key", regex: /\bAIza[0-9A-Za-z_-]{20,}\b/g },
  {
    label: "Private IPv4",
    regex:
      /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})\b/g,
  },
  {
    label: "Unix home absolute path",
    regex: /\/home\/[A-Za-z0-9_-][A-Za-z0-9._-]*\/[^\s"'`)\]]+/g,
  },
  {
    label: "macOS home absolute path",
    regex: /\/Users\/[A-Za-z0-9_-][A-Za-z0-9._-]*\/[^\s"'`)\]]+/g,
  },
  {
    label: "Windows absolute user path",
    regex:
      /[A-Za-z]:\\Users\\[A-Za-z0-9_-][A-Za-z0-9._-]*\\[^\s"'`)\]]+/g,
  },
];

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  ".codex",
  ".output",
  "release",
  ".release",
  "dist",
  "build",
]);

const LINK_REGEX = /!?\[[^\]]*]\(([^)]+)\)/g;

function walkMarkdownFiles(rootDir) {
  const results = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(rootDir, entry.name);
    const relativePath = path.relative(REPO_ROOT, absolutePath).split(path.sep).join("/");

    if (entry.isDirectory()) {
      results.push(...walkMarkdownFiles(absolutePath));
      continue;
    }

    if (entry.isFile() && /\.md$/i.test(relativePath)) {
      results.push(relativePath);
    }
  }

  return results;
}

function isAllowedMarkdownPath(relativePath) {
  if (relativePath.startsWith(`${DOCS_ROOT}/`)) {
    return true;
  }
  if (ALLOWED_ROOT_MARKDOWN.has(relativePath)) {
    return true;
  }
  if (ALLOWED_NON_DOC_MARKDOWN_PATTERNS.some((pattern) => pattern.test(relativePath))) {
    return true;
  }
  return false;
}

function resolveLinkTarget(markdownPath, rawTarget) {
  let target = rawTarget.trim();
  if (!target) {
    return null;
  }

  if (target.startsWith("<") && target.endsWith(">")) {
    target = target.slice(1, -1).trim();
  }

  const withOptionalTitle = /^(.*?)(?:\s+"[^"]*")$/.exec(target);
  if (withOptionalTitle) {
    target = withOptionalTitle[1];
  }

  if (
    target.startsWith("http://") ||
    target.startsWith("https://") ||
    target.startsWith("mailto:") ||
    target.startsWith("tel:") ||
    target.startsWith("data:") ||
    target.startsWith("#")
  ) {
    return null;
  }

  const noFragment = target.split("#")[0];
  const noQuery = noFragment.split("?")[0];
  if (!noQuery) {
    return null;
  }

  let decodedTarget = noQuery;
  try {
    decodedTarget = decodeURIComponent(noQuery);
  } catch {
    // Keep original string when it is not URI-encoded.
  }

  const markdownDir = path.dirname(path.join(REPO_ROOT, markdownPath));
  const resolvedAbsolute = path.resolve(markdownDir, decodedTarget);
  const resolvedRelative = path.relative(REPO_ROOT, resolvedAbsolute).split(path.sep).join("/");

  return { target: decodedTarget, resolvedAbsolute, resolvedRelative };
}

function findFirstNonAsciiCharacter(content) {
  for (let index = 0; index < content.length; index += 1) {
    const code = content.charCodeAt(index);
    if (code > 127) {
      return { index, char: content[index], code };
    }
  }
  return null;
}

function main() {
  const errors = [];
  const markdownFiles = walkMarkdownFiles(REPO_ROOT).sort();

  for (const filePath of markdownFiles) {
    if (!filePath.endsWith(".md")) {
      errors.push(`Markdown extension must be lowercase .md: ${filePath}`);
      continue;
    }

    if (!isAllowedMarkdownPath(filePath)) {
      errors.push(
        `Markdown outside allowed locations: ${filePath} (allowed: docs/ and approved root entry docs)`,
      );
    }
  }

  for (const requiredPath of REQUIRED_SECTION_INDEXES) {
    if (!fs.existsSync(path.join(REPO_ROOT, requiredPath))) {
      errors.push(`Missing required section index: ${requiredPath}`);
    }
  }

  const featurePlansDir = path.join(REPO_ROOT, "docs/features/plans");
  if (fs.existsSync(featurePlansDir)) {
    const planEntries = fs
      .readdirSync(featurePlansDir)
      .filter((entry) => entry.endsWith(".md") && entry !== "README.md");
    if (planEntries.length > 0) {
      errors.push(
        `docs/features/plans must stay lightweight. Move long plans to docs/archive/feature-plans/: ${planEntries.join(", ")}`,
      );
    }
  }

  for (const filePath of markdownFiles) {
    if (!isAllowedMarkdownPath(filePath)) {
      continue;
    }

    const absolutePath = path.join(REPO_ROOT, filePath);
    const content = fs.readFileSync(absolutePath, "utf8");

    const nonAscii = findFirstNonAsciiCharacter(content);
    if (nonAscii) {
      errors.push(
        `Non-ASCII character found in ${filePath} (U+${nonAscii.code.toString(16).toUpperCase().padStart(4, "0")} "${nonAscii.char}")`,
      );
    }

    for (const pattern of SENSITIVE_PATTERNS) {
      const match = pattern.regex.exec(content);
      pattern.regex.lastIndex = 0;
      if (match) {
        errors.push(
          `Possible sensitive value in ${filePath}: ${pattern.label} -> "${match[0]}"`,
        );
      }
    }

    const linkMatches = content.matchAll(LINK_REGEX);
    for (const match of linkMatches) {
      const rawTarget = match[1];
      const resolved = resolveLinkTarget(filePath, rawTarget);
      if (!resolved) {
        continue;
      }

      if (!fs.existsSync(resolved.resolvedAbsolute)) {
        errors.push(
          `Broken relative link in ${filePath}: "${resolved.target}" -> "${resolved.resolvedRelative}"`,
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error("Documentation validation failed:\n");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Documentation validation passed (${markdownFiles.length} markdown files scanned).`,
  );
}

main();
