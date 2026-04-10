import { execFileSync } from "node:child_process";

const BEHAVIOR_CONTRACT_DOC_RULES = [
  { type: "prefix", value: "docs/api/" },
  { type: "exact", value: "docs/contributing/behavior-contract-governance.md" },
  { type: "exact", value: "docs/templates/behavior-contract-template.md" },
];

const TRACEABILITY_DOC_PREFIX = "docs/quality/references/";
const TRACEABILITY_DOC_SUFFIX = "traceability-matrix.md";

const BEHAVIOR_SENSITIVE_RULES = [
  { type: "prefix", value: "entrypoints/content/providers/" },
  { type: "exact", value: "entrypoints/content/platform-runtime.ts" },
  { type: "exact", value: "entrypoints/content/overlay/capture-consent.ts" },
  { type: "exact", value: "entrypoints/content/history-service.ts" },
  { type: "exact", value: "entrypoints/background/history.ts" },
  { type: "exact", value: "entrypoints/background/quick-access-runtime.ts" },
  { type: "exact", value: "entrypoints/background/settings.ts" },
  { type: "exact", value: "entrypoints/background/types/index.ts" },
  { type: "exact", value: "entrypoints/shared/meeting-session.ts" },
  { type: "exact", value: "entrypoints/shared/quick-access-status.ts" },
  { type: "exact", value: "entrypoints/shared/settings-defaults.ts" },
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
  const baseSha = process.env.BEHAVIOR_CONTRACT_BASE_SHA?.trim();
  const headSha = process.env.BEHAVIOR_CONTRACT_HEAD_SHA?.trim() || "HEAD";

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

function isBehaviorSensitiveChange(filePath) {
  return BEHAVIOR_SENSITIVE_RULES.some((rule) => matchesRule(filePath, rule));
}

function isBehaviorContractDocChange(filePath) {
  if (
    filePath.startsWith(TRACEABILITY_DOC_PREFIX) &&
    filePath.endsWith(TRACEABILITY_DOC_SUFFIX)
  ) {
    return true;
  }

  if (!filePath.endsWith(".md")) {
    return false;
  }

  if (filePath.startsWith("docs/api/")) {
    return filePath.endsWith("-behavior-contract.md") || filePath === "docs/api/README.md";
  }

  return BEHAVIOR_CONTRACT_DOC_RULES.some((rule) => matchesRule(filePath, rule));
}

function hasTraceabilityUpdate(filePath) {
  return (
    filePath.startsWith(TRACEABILITY_DOC_PREFIX) &&
    filePath.endsWith(TRACEABILITY_DOC_SUFFIX)
  );
}

function hasApiContractUpdate(filePath) {
  return filePath.startsWith("docs/api/") && filePath.endsWith("-behavior-contract.md");
}

function main() {
  if (process.env.BEHAVIOR_CONTRACT_SYNC_BYPASS === "1") {
    console.log("Behavior-contract sync check bypassed by BEHAVIOR_CONTRACT_SYNC_BYPASS=1.");
    return;
  }

  const changedFiles = readChangedFiles();
  if (changedFiles.length === 0) {
    console.log("Behavior-contract sync check skipped: no changed files detected.");
    return;
  }

  const behaviorSensitiveChanges = changedFiles.filter(isBehaviorSensitiveChange);
  if (behaviorSensitiveChanges.length === 0) {
    console.log("Behavior-contract sync check passed: no behavior-sensitive code changes detected.");
    return;
  }

  const hasBehaviorDocUpdate = changedFiles.some(isBehaviorContractDocChange);
  const hasTraceabilityDocUpdate = changedFiles.some(hasTraceabilityUpdate);
  const hasApiDocUpdate = changedFiles.some(hasApiContractUpdate);

  if (hasBehaviorDocUpdate && hasTraceabilityDocUpdate && hasApiDocUpdate) {
    console.log(
      `Behavior-contract sync check passed: ${behaviorSensitiveChanges.length} behavior-sensitive change(s) with matching contract + traceability updates.`
    );
    return;
  }

  console.error("Behavior-contract sync validation failed:\n");
  console.error(
    "Behavior-sensitive implementation files changed without required behavior-contract synchronization."
  );
  console.error("\nChanged behavior-sensitive files:");
  for (const filePath of behaviorSensitiveChanges) {
    console.error(`- ${filePath}`);
  }
  console.error("\nRequired update expectation:");
  console.error("- update at least one `docs/api/*-behavior-contract.md` file");
  console.error(
    `- update at least one traceability matrix under ${TRACEABILITY_DOC_PREFIX}*${TRACEABILITY_DOC_SUFFIX}`
  );
  console.error("- keep behavior-governance/template docs synced when policy or format changes");
  console.error("\nThen run:");
  console.error("- pnpm docs:check");
  console.error("- pnpm docs:check:behavior");
  process.exit(1);
}

main();
