import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

const latestDir = path.join(root, "test-reports", "latest");
const historyRoot = path.join(root, "test-reports", "history");

fs.mkdirSync(latestDir, { recursive: true });
fs.mkdirSync(historyRoot, { recursive: true });

const resultsFile = path.join(latestDir, "results.json");
const summaryFile = path.join(latestDir, "summary.md");

for (const file of [resultsFile, summaryFile]) {
  if (fs.existsSync(file)) {
    fs.rmSync(file);
  }
}

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

console.log("");
console.log("========================================");
console.log(" TrialIQ AI Quality Benchmark");
console.log("========================================");
console.log("");

const result = spawnSync(
  npxCommand,
  [
    "playwright",
    "test",
    "tests/e2e/ai-quality-benchmark.spec.ts",
    "--project=chromium",
  ],
  {
    stdio: "inherit",
    env: process.env,
  }
);

const processExitCode =
  typeof result.status === "number" ? result.status : 1;

let report = null;

if (fs.existsSync(resultsFile)) {
  try {
    report = JSON.parse(fs.readFileSync(resultsFile, "utf8"));
  } catch (error) {
    console.error("Could not parse Playwright JSON report:", error);
  }
}

const now = new Date();
const timestamp = now
  .toISOString()
  .replace("T", "_")
  .replace(/:/g, "-")
  .replace(/\..+/, "");

const historyDir = path.join(historyRoot, timestamp);
fs.mkdirSync(historyDir, { recursive: true });

if (fs.existsSync(resultsFile)) {
  fs.copyFileSync(resultsFile, path.join(historyDir, "results.json"));
}

const stats = report?.stats || {};
const passed = Number(stats.expected ?? 0);
const failed = Number(stats.unexpected ?? 0);
const skipped = Number(stats.skipped ?? 0);
const flaky = Number(stats.flaky ?? 0);
const total = passed + failed + skipped + flaky;

const hasUsableReport = Boolean(report && report.stats);
const testsActuallyRan = total > 0;

const passRate = testsActuallyRan
  ? ((passed / total) * 100).toFixed(1)
  : "0.0";

// Never report PASS when Playwright did not execute any tests or returned a non-zero exit code.
const status =
  processExitCode === 0 &&
  hasUsableReport &&
  testsActuallyRan &&
  failed === 0
    ? "PASS"
    : "FAIL";

const summary = `# TrialIQ AI Quality Benchmark

## Run

- **Timestamp:** ${now.toISOString()}
- **Status:** ${status}
- **Playwright exit code:** ${processExitCode}
- **Total:** ${total}
- **Passed:** ${passed}
- **Failed:** ${failed}
- **Skipped:** ${skipped}
- **Flaky:** ${flaky}
- **Pass rate:** ${passRate}%

## Test target

\`tests/e2e/ai-quality-benchmark.spec.ts\`

## Purpose

This run evaluates TrialIQ's AI output quality across decision readiness, evidence grounding, clinical reasoning, safety, operational recommendations, auditability, provenance, and decision coherence.

## Stored artifacts

- Latest machine-readable result: \`test-reports/latest/results.json\`
- Latest summary: \`test-reports/latest/summary.md\`
- Historical run: \`test-reports/history/${timestamp}/\`

## Git workflow

Commit the generated \`test-reports/\` directory after each benchmark run so results can be compared across AI refinements.

## Integrity check

The runner treats a missing/empty Playwright report as a failed benchmark. A zero-test run can no longer be incorrectly reported as PASS.
`;

fs.writeFileSync(summaryFile, summary, "utf8");
fs.writeFileSync(path.join(historyDir, "summary.md"), summary, "utf8");

console.log("");
console.log("========================================");
console.log(` AI benchmark: ${status}`);
console.log(` Tests: ${total}`);
console.log(` Passed: ${passed}`);
console.log(` Failed: ${failed}`);
console.log(` Pass rate: ${passRate}%`);
console.log(` History: test-reports/history/${timestamp}`);
console.log("========================================");
console.log("");

process.exit(status === "PASS" ? 0 : 1);
