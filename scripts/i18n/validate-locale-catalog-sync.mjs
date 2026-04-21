import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const SHIPPED_UI_LOCALES = [
  "en",
  "fa",
  "ar",
  "es",
  "fr",
  "de",
  "pt",
  "ru",
  "hi",
  "zh",
  "ja",
  "ko",
];

export const UI_LOCALE_CATALOG_DIR = "entrypoints/shared/i18n/messages";
export const UI_LOCALE_CATALOG_PATHS = SHIPPED_UI_LOCALES.map(
  (locale) => `${UI_LOCALE_CATALOG_DIR}/${locale}.ts`,
);
export const CANONICAL_UI_LOCALE_CATALOG_PATH =
  `${UI_LOCALE_CATALOG_DIR}/en.ts`;

function normalizeRepoPath(filePath) {
  return filePath.split(path.sep).join("/").trim();
}

function parseCliArgs(argv) {
  let base = null;
  let head = null;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--base") {
      base = argv[index + 1] || null;
      index += 1;
      continue;
    }
    if (token === "--head") {
      head = argv[index + 1] || null;
      index += 1;
    }
  }

  return { base, head };
}

function isZeroSha(value) {
  return typeof value === "string" && /^0{7,40}$/u.test(value.trim());
}

function runGitNameOnly(args, cwd) {
  const stdout = execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return stdout
    .split(/\r?\n/u)
    .map((line) => normalizeRepoPath(line))
    .filter(Boolean);
}

export function resolveLocaleCatalogDiffFiles(
  { base = null, head = null } = {},
  cwd = process.cwd(),
) {
  if (base && head) {
    if (isZeroSha(base)) {
      return runGitNameOnly(
        [
          "diff-tree",
          "--no-commit-id",
          "--name-only",
          "-r",
          head,
          "--",
          UI_LOCALE_CATALOG_DIR,
        ],
        cwd,
      );
    }

    return runGitNameOnly(
      [
        "diff",
        "--name-only",
        "--diff-filter=ACMR",
        base,
        head,
        "--",
        UI_LOCALE_CATALOG_DIR,
      ],
      cwd,
    );
  }

  const changedTracked = runGitNameOnly(
    ["diff", "--name-only", "--diff-filter=ACMR", "HEAD", "--", UI_LOCALE_CATALOG_DIR],
    cwd,
  );
  const untracked = runGitNameOnly(
    ["ls-files", "--others", "--exclude-standard", "--", UI_LOCALE_CATALOG_DIR],
    cwd,
  );

  return [...new Set([...changedTracked, ...untracked])];
}

export function evaluateUiLocaleCatalogSync(changedFiles) {
  const normalizedChangedFiles = [...new Set(changedFiles.map(normalizeRepoPath))];
  const changedCatalogs = normalizedChangedFiles.filter((file) =>
    UI_LOCALE_CATALOG_PATHS.includes(file),
  );

  if (changedCatalogs.length === 0) {
    return {
      success: true,
      applies: false,
      reason: "no_locale_catalog_changes",
      changedCatalogs: [],
      missingCatalogs: [],
    };
  }

  if (!changedCatalogs.includes(CANONICAL_UI_LOCALE_CATALOG_PATH)) {
    return {
      success: true,
      applies: true,
      reason: "canonical_catalog_unchanged",
      changedCatalogs,
      missingCatalogs: [],
    };
  }

  const missingCatalogs = UI_LOCALE_CATALOG_PATHS.filter(
    (file) => !changedCatalogs.includes(file),
  );

  if (missingCatalogs.length > 0) {
    return {
      success: false,
      applies: true,
      reason: "missing_shipped_locale_updates",
      changedCatalogs,
      missingCatalogs,
    };
  }

  return {
    success: true,
    applies: true,
    reason: "all_shipped_locale_catalogs_updated",
    changedCatalogs,
    missingCatalogs: [],
  };
}

function formatReport(result, diffScope) {
  const scopeLabel = diffScope.base && diffScope.head
    ? `${diffScope.base}..${diffScope.head}`
    : "working-tree-vs-HEAD";

  if (!result.applies) {
    return [
      `UI locale catalog sync check skipped: no shipped locale catalog changes detected in ${scopeLabel}.`,
    ].join("\n");
  }

  if (result.reason === "canonical_catalog_unchanged") {
    return [
      `UI locale catalog sync check passed: ${CANONICAL_UI_LOCALE_CATALOG_PATH} did not change in ${scopeLabel}.`,
      "Locale-only fixes are allowed without touching every shipped locale catalog.",
      `Changed locale catalogs: ${result.changedCatalogs.join(", ")}`,
    ].join("\n");
  }

  if (result.success) {
    return [
      `UI locale catalog sync check passed: canonical locale changes in ${scopeLabel} updated every shipped locale catalog.`,
      `Changed locale catalogs: ${result.changedCatalogs.join(", ")}`,
    ].join("\n");
  }

  return [
    `UI locale catalog sync check failed: ${CANONICAL_UI_LOCALE_CATALOG_PATH} changed in ${scopeLabel}, but not every shipped locale catalog was updated in the same change.`,
    `Changed locale catalogs: ${result.changedCatalogs.join(", ")}`,
    `Missing locale catalogs: ${result.missingCatalogs.join(", ")}`,
    "Repository rule: when the canonical English UI catalog changes, every shipped locale catalog must be touched in the same change.",
  ].join("\n");
}

export function runUiLocaleCatalogSyncValidation(
  args = process.argv.slice(2),
  cwd = process.cwd(),
) {
  const diffScope = parseCliArgs(args);
  const changedFiles = resolveLocaleCatalogDiffFiles(diffScope, cwd);
  const result = evaluateUiLocaleCatalogSync(changedFiles);
  const report = formatReport(result, diffScope);

  const output = result.success ? console.log : console.error;
  output(report);

  return result.success ? 0 : 1;
}

const invokedPath = process.argv[1]
  ? normalizeRepoPath(path.resolve(process.argv[1]))
  : null;
const currentModulePath = normalizeRepoPath(path.resolve(fileURLToPath(import.meta.url)));

if (invokedPath === currentModulePath) {
  process.exitCode = runUiLocaleCatalogSyncValidation();
}
