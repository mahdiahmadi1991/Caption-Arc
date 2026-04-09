import { execFileSync } from "node:child_process";

const BUSINESS_DOC_PREFIX = "docs/product/";
const BUSINESS_GOVERNANCE_DOC =
  "docs/contributing/business-documentation-governance.md";

const BUSINESS_SENSITIVE_RULES = [
  { type: "prefix", value: "entrypoints/content/providers/" },
  { type: "exact", value: "entrypoints/content/platform-runtime.ts" },
  { type: "exact", value: "entrypoints/background/assistant.ts" },
  { type: "exact", value: "entrypoints/background/history.ts" },
  { type: "exact", value: "entrypoints/background/translation.ts" },
  { type: "prefix", value: "entrypoints/background/cloud-sync/" },
  { type: "exact", value: "entrypoints/background/data-transfer.ts" },
  { type: "exact", value: "entrypoints/background/settings.ts" },
  { type: "exact", value: "entrypoints/shared/summary-profiles.ts" },
  { type: "exact", value: "entrypoints/shared/summary-generation.ts" },
  { type: "exact", value: "entrypoints/shared/meeting-summary.ts" },
  { type: "exact", value: "entrypoints/shared/meeting-session.ts" },
  { type: "exact", value: "entrypoints/shared/language-metadata.ts" },
  { type: "exact", value: "entrypoints/shared/browser-capabilities.ts" },
  { type: "exact", value: "wxt.config.ts" },
];

function runGit(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function normalizeFileList(rawOutput) {
  return rawOutput
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readChangedFiles() {
  const baseSha = process.env.BUSINESS_DOCS_BASE_SHA?.trim();
  const headSha = process.env.BUSINESS_DOCS_HEAD_SHA?.trim() || "HEAD";

  if (baseSha) {
    try {
      return normalizeFileList(runGit(["diff", "--name-only", `${baseSha}...${headSha}`]));
    } catch {
      // Fallback to local comparisons below.
    }
  }

  try {
    return normalizeFileList(runGit(["diff", "--name-only", "HEAD"]));
  } catch {
    // Fall through.
  }

  try {
    return normalizeFileList(runGit(["diff", "--name-only", "HEAD~1..HEAD"]));
  } catch {
    return [];
  }
}

function matchesRule(filePath, rule) {
  if (rule.type === "exact") {
    return filePath === rule.value;
  }

  return filePath.startsWith(rule.value);
}

function isBusinessSensitiveChange(filePath) {
  return BUSINESS_SENSITIVE_RULES.some((rule) => matchesRule(filePath, rule));
}

function isBusinessDocChange(filePath) {
  return (
    filePath.startsWith(BUSINESS_DOC_PREFIX) || filePath === BUSINESS_GOVERNANCE_DOC
  );
}

function main() {
  if (process.env.BUSINESS_DOCS_SYNC_BYPASS === "1") {
    console.log("Business-doc sync check bypassed by BUSINESS_DOCS_SYNC_BYPASS=1.");
    return;
  }

  const changedFiles = readChangedFiles();
  if (changedFiles.length === 0) {
    console.log("Business-doc sync check skipped: no changed files detected.");
    return;
  }

  const businessSensitiveChanges = changedFiles.filter(isBusinessSensitiveChange);
  if (businessSensitiveChanges.length === 0) {
    console.log("Business-doc sync check passed: no business-sensitive code changes detected.");
    return;
  }

  const hasBusinessDocUpdate = changedFiles.some(isBusinessDocChange);
  if (hasBusinessDocUpdate) {
    console.log(
      `Business-doc sync check passed: ${businessSensitiveChanges.length} business-sensitive change(s) with matching business-doc update(s).`
    );
    return;
  }

  console.error("Business documentation sync validation failed:\n");
  console.error(
    "Business-sensitive implementation files changed without updates to canonical business documentation."
  );
  console.error("\nChanged business-sensitive files:");
  for (const filePath of businessSensitiveChanges) {
    console.error(`- ${filePath}`);
  }
  console.error("\nRequired update expectation:");
  console.error(`- update at least one file under ${BUSINESS_DOC_PREFIX}`);
  console.error(`- or update ${BUSINESS_GOVERNANCE_DOC} when policy changed`);
  console.error("\nThen run:");
  console.error("- pnpm docs:check");
  console.error("- pnpm docs:check:business");
  process.exit(1);
}

main();
