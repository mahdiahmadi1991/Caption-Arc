#!/usr/bin/env node

import { execSync, spawnSync } from "node:child_process";

function parseArgs(argv) {
  const args = [...argv];
  const flags = {
    run: false,
    base: "HEAD",
    moduleScope: false,
    files: [],
  };

  while (args.length > 0) {
    const next = args.shift();
    if (!next) {
      continue;
    }

    if (next === "--run") {
      flags.run = true;
      continue;
    }

    if (next === "--base") {
      const value = args.shift();
      if (value) {
        flags.base = value;
      }
      continue;
    }

    if (next === "--module-scope") {
      flags.moduleScope = true;
      continue;
    }

    flags.files.push(next);
  }

  return flags;
}

function readChangedFiles(baseRef) {
  try {
    const output = execSync(
      `git diff --name-only --relative --diff-filter=ACMRTUXB ${baseRef}`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function addRecommendation(store, command, reason) {
  if (!store.has(command)) {
    store.set(command, new Set());
  }
  store.get(command).add(reason);
}

function classifyAndRecommend(files, { moduleScope }) {
  const recommendations = new Map();
  let hasScopedMatch = false;

  for (const file of files) {
    const add = (command, reason) => {
      hasScopedMatch = true;
      addRecommendation(recommendations, command, reason);
    };

    if (/^entrypoints\/content\/overlay\/|^entrypoints\/content\/caption-ui/.test(file)) {
      add(
        "pnpm vitest run tests/google-meet/google-meet-overlay-settings.contract.test.ts",
        `${file}: overlay settings/visibility behavior changed`
      );
      add(
        "pnpm vitest run tests/google-meet/google-meet-prompts.contract.test.ts",
        `${file}: overlay prompts/consent behavior changed`
      );
      add(
        "pnpm chrome:smoke:live google-meet lobby",
        `${file}: validate pre-join overlay behavior in DLS`
      );
      add(
        "pnpm chrome:smoke:live:google:settings lobby",
        `${file}: validate runtime settings impact in DLS`
      );
    }

    if (/^entrypoints\/content\/providers\/google-meet/.test(file)) {
      add(
        "pnpm vitest run tests/google-meet/google-meet-provider.contract.test.ts",
        `${file}: Google provider contract changed`
      );
      add(
        "pnpm chrome:smoke:live google-meet meeting",
        `${file}: validate Google in-meeting behavior in DLS`
      );
    }

    if (/^entrypoints\/content\/(platform-runtime|render|state|index)/.test(file)) {
      add(
        "pnpm vitest run tests/google-meet/google-meet-runtime-reset.contract.test.ts",
        `${file}: content runtime lifecycle changed`
      );
      add(
        "pnpm vitest run tests/google-meet/content-script-marker.contract.test.ts",
        `${file}: content-script runtime marker behavior changed`
      );
      add(
        "pnpm chrome:smoke:live google-meet meeting",
        `${file}: validate content runtime lifecycle in DLS`
      );
    }

    if (/^entrypoints\/background\/(history|settings|index|types)/.test(file)) {
      add(
        "pnpm vitest run tests/google-meet/google-meet-prompts.contract.test.ts",
        `${file}: background prompt/session behavior changed`
      );
      add(
        "pnpm chrome:smoke:live google-meet continuation",
        `${file}: validate continuation prompt in DLS`
      );
    }

    if (/^entrypoints\/options\/|^entrypoints\/meeting-history\//.test(file)) {
      add(
        "pnpm vitest run tests/google-meet/use-diagnostics-console.contract.test.ts",
        `${file}: options/diagnostics console behavior changed`
      );
      add(
        "pnpm vitest run tests/google-meet/diagnostics-viewer.contract.test.ts",
        `${file}: diagnostics viewer behavior changed`
      );
    }

    if (/^entrypoints\/shared\/i18n\/|^entrypoints\/shared\/ui-language/.test(file)) {
      add(
        "pnpm i18n:check",
        `${file}: locale catalog sync enforcement applies`
      );
      add(
        "pnpm vitest run tests/google-meet/ui-i18n.contract.test.ts",
        `${file}: UI i18n behavior changed`
      );
      add(
        "pnpm vitest run tests/google-meet/i18n-runtime.contract.test.ts",
        `${file}: i18n runtime behavior changed`
      );
      add(
        "pnpm vitest run tests/google-meet/diagnostics-i18n-boundary.contract.test.ts",
        `${file}: i18n diagnostics boundaries changed`
      );
    }

    if (/^entrypoints\/content\/providers\/(microsoft-teams|teams)/.test(file)) {
      add(
        "pnpm chrome:smoke:live microsoft-teams lobby",
        `${file}: Teams prejoin flow changed`
      );
      add(
        "pnpm chrome:smoke:live microsoft-teams meeting",
        `${file}: Teams meeting flow changed`
      );
    }

    if (/^entrypoints\/content\/providers\/zoom/.test(file)) {
      add(
        "pnpm chrome:smoke:live zoom-web lobby",
        `${file}: Zoom prejoin flow changed`
      );
      add(
        "pnpm chrome:smoke:live zoom-web meeting",
        `${file}: Zoom meeting flow changed`
      );
    }

    if (/^scripts\/manual-smoke\//.test(file)) {
      add(
        "pnpm vitest run tests/google-meet/manual-smoke-launch.contract.test.ts",
        `${file}: smoke launch/runtime orchestration changed`
      );
      add(
        "pnpm chrome:smoke:live google-meet meeting",
        `${file}: validate smoke harness in DLS`
      );
      if (/smoke-google-overlay-settings/.test(file)) {
        add(
          "pnpm chrome:smoke:live:google:settings meeting",
          `${file}: validate Google overlay settings smoke runner`
        );
      }
    }

    if (/^tests\/google-meet\//.test(file)) {
      add(`pnpm vitest run ${file}`, `${file}: changed test file should run directly`);
    }
  }

  if (!hasScopedMatch) {
    if (files.length > 0 && moduleScope) {
      addRecommendation(
        recommendations,
        "pnpm vitest run tests/google-meet/manual-smoke-launch.contract.test.ts",
        "No direct module mapping found; run minimal smoke-harness contract check"
      );
      addRecommendation(
        recommendations,
        "pnpm chrome:smoke:live google-meet meeting",
        "No direct module mapping found; run minimal DLS acceptance check"
      );
    } else {
      addRecommendation(
        recommendations,
        "pnpm test:google",
        "No direct flow mapping found; run base Google regression"
      );
    }
  }

  return recommendations;
}

function printPlan(files, recommendations, moduleScope) {
  console.log("Targeted Test Plan");
  console.log(`Mode: ${moduleScope ? "module-scope" : "diff-scope"}`);
  console.log(`Changed files: ${files.length}`);
  for (const file of files) {
    console.log(`- ${file}`);
  }
  if (files.length === 0) {
    console.log("- (none detected from git diff)");
  }

  console.log("\nRecommended commands:");
  let index = 0;
  for (const [command, reasons] of recommendations.entries()) {
    index += 1;
    console.log(`${index}. ${command}`);
    for (const reason of reasons) {
      console.log(`   - ${reason}`);
    }
  }
}

function runPlan(recommendations) {
  let failed = 0;
  let index = 0;
  const total = recommendations.size;

  for (const command of recommendations.keys()) {
    index += 1;
    console.log(`\n[${index}/${total}] ${command}`);
    const result = spawnSync("bash", ["-lc", command], { stdio: "inherit" });
    if ((result.status ?? 1) !== 0) {
      failed += 1;
      console.error(`Command failed: ${command}`);
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
}

const flags = parseArgs(process.argv.slice(2));
if (flags.moduleScope && flags.files.length === 0) {
  console.error("Module-scope mode requires explicit module/file paths.");
  process.exit(1);
}

const files = flags.files.length > 0 ? flags.files : readChangedFiles(flags.base);
const recommendations = classifyAndRecommend(files, { moduleScope: flags.moduleScope });

printPlan(files, recommendations, flags.moduleScope);

if (flags.run) {
  runPlan(recommendations);
}
