import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { reviewQualitySuite } from "@/lib/testAiReviewer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Suite = "ai" | "ui";

function runId(date: Date) {
  return date.toISOString().replace("T", "_").replace(/:/g, "-").replace(/\.\d{3}Z$/, "Z");
}

function npxCommand() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

function flattenPlaywrightTests(value: any, output: any[] = []) {
  if (!value) return output;
  for (const spec of value.specs || []) {
    for (const test of spec.tests || []) {
      const results = test.results || [];
      const last = results[results.length - 1];
      const status = last?.status || test.status;
      const error = last?.error?.message || last?.errors?.[0]?.message;
      output.push({
        id: Number(String(spec.title).match(/^([0-9]+)/)?.[1] || output.length + 1),
        name: spec.title,
        passed: status === "passed",
        durationMs: Number(last?.duration || 0),
        error,
      });
    }
  }
  for (const suite of value.suites || []) flattenPlaywrightTests(suite, output);
  return output;
}

async function runPlaywright(args: string[], env: NodeJS.ProcessEnv) {
  return await new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(npxCommand(), args, {
      cwd: process.cwd(),
      env,
      windowsHide: true,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (code: number) => {
      if (settled) return;
      settled = true;
      resolve({ code, stdout, stderr });
    };

    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error) => { stderr += `\n[runner spawn error] ${error.message}`; finish(1); });
    child.on("close", (code) => finish(code ?? 1));

    setTimeout(() => {
      if (!settled) {
        stderr += "\n[runner timeout] Playwright runner exceeded 270 seconds.";
        child.kill();
        finish(1);
      }
    }, 270_000);
  });
}

async function loadUiEvidence(evidenceDir: string, tests: any[]) {
  return Promise.all(tests.map(async (test) => {
    const file = path.join(evidenceDir, `${String(test.id).padStart(2, "0")}.json`);
    try {
      const evidence = JSON.parse(await fs.readFile(file, "utf8"));
      const screenshotPath = evidence.screenshotPath as string | undefined;
      let screenshotBase64: string | undefined;
      if (screenshotPath) {
        try { screenshotBase64 = (await fs.readFile(screenshotPath)).toString("base64"); } catch {}
      }
      return { ...test, evidence: { ...evidence, screenshotBase64 } };
    } catch {
      return test;
    }
  }));
}

export async function POST(request: NextRequest) {
  const started = new Date();
  const id = runId(started);
  const dir = path.join(process.cwd(), "test-reports", "web-runs");
  const evidenceDir = path.join(dir, id, "evidence");
  const reportFile = path.join(dir, `${id}.playwright.json`);
  const resultFile = path.join(dir, `${id}.result.json`);
  const reportPath = path.join(dir, `${id}.json`);
  const logPath = path.join(dir, `${id}.log.txt`);

  try {
    if (process.env.NODE_ENV === "production") throw new Error("The local Playwright test runner is disabled in production. Run TrialIQ locally.");
    if (!process.env.PLAYWRIGHT_EMAIL || !process.env.PLAYWRIGHT_PASSWORD) throw new Error("PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD must be configured once in .env.local. The web test page never asks for them.");

    let body: { suite?: Suite } = {};
    try { body = await request.json(); } catch {}
    const suite: Suite = body.suite === "ui" ? "ui" : "ai";
    const suiteName = suite === "ui" ? "UI Quality" : "AI Quality Benchmark";
    const spec = suite === "ui" ? "tests/e2e/ui-quality.spec.ts" : "tests/e2e/ai-quality-benchmark.spec.ts";

    await fs.mkdir(dir, { recursive: true });
    await fs.mkdir(evidenceDir, { recursive: true });

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL || request.nextUrl.origin,
      PLAYWRIGHT_HEADLESS: "true",
      PLAYWRIGHT_REPORT_FILE: reportFile,
      PLAYWRIGHT_RESULT_FILE: resultFile,
      PLAYWRIGHT_RUN_ID: id,
      PLAYWRIGHT_EVIDENCE_DIR: evidenceDir,
    };

    const processResult = await runPlaywright(["playwright", "test", spec, "--project=chromium"], env);
    const completed = new Date();
    let playwrightJson: any = null;
    let aiResult: any = null;
    try { playwrightJson = JSON.parse(await fs.readFile(reportFile, "utf8")); } catch {}
    try { aiResult = JSON.parse(await fs.readFile(resultFile, "utf8")); } catch {}

    const tests = flattenPlaywrightTests(playwrightJson);
    const total = tests.length || Number(playwrightJson?.stats?.expected || 0) + Number(playwrightJson?.stats?.unexpected || 0) + Number(playwrightJson?.stats?.skipped || 0) + Number(playwrightJson?.stats?.flaky || 0);
    const passed = tests.filter((test) => test.passed).length;
    const failed = Math.max(total - passed, 0);
    const logs = `${processResult.stdout}${processResult.stderr ? `\n${processResult.stderr}` : ""}`.trim();
    const error = processResult.code === 0 && total > 0 && passed === total ? undefined : tests.find((test) => !test.passed)?.error || logs || `Playwright exited with code ${processResult.code}`;

    const evidenceTests = suite === "ui" ? await loadUiEvidence(evidenceDir, tests) : tests;
    let aiReview: any = null;
    try {
      aiReview = await reviewQualitySuite({ suite: suiteName, tests: evidenceTests, aiResult });
    } catch (reviewError) {
      aiReview = {
        status: "FAILED",
        model: process.env.TEST_REVIEW_MODEL || "gemini-3.6-flash",
        overallScore: null,
        overallSummary: "The automated suite completed, but the AI review layer failed.",
        reviews: [],
        error: reviewError instanceof Error ? reviewError.message : String(reviewError),
      };
    }

    const report = {
      id,
      suite: suiteName,
      suiteKey: suite,
      startedAt: started.toISOString(),
      completedAt: completed.toISOString(),
      durationMs: completed.getTime() - started.getTime(),
      status: processResult.code === 0 && total > 0 && passed === total ? "PASS" : "FAIL",
      total,
      passed,
      failed,
      result: aiResult,
      tests,
      aiReview,
      evidenceDir: suite === "ui" ? `${id}/evidence` : undefined,
      error,
      logs,
      logFile: `${id}.log.txt`,
    };

    await fs.writeFile(logPath, logs, "utf8");
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    return NextResponse.json({ ok: report.status === "PASS", report });
  } catch (error) {
    const completed = new Date();
    const message = error instanceof Error ? error.message : String(error);
    const report = { id, suite: "Test Suite", startedAt: started.toISOString(), completedAt: completed.toISOString(), durationMs: completed.getTime() - started.getTime(), status: "FAIL", total: 0, passed: 0, failed: 0, result: null, tests: [], aiReview: null, error: message, logs: message };
    await fs.mkdir(dir, { recursive: true }).catch(() => undefined);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8").catch(() => undefined);
    await fs.writeFile(logPath, message, "utf8").catch(() => undefined);
    return NextResponse.json({ ok: false, report });
  }
}
