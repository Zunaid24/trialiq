import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

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
  return await new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(npxCommand(), args, {
      cwd: process.cwd(),
      env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

export async function POST(request: NextRequest) {
  const started = new Date();
  const id = runId(started);
  const dir = path.join(process.cwd(), "test-reports", "web-runs");
  const reportFile = path.join(dir, `${id}.playwright.json`);
  const resultFile = path.join(dir, `${id}.result.json`);
  const reportPath = path.join(dir, `${id}.json`);
  const logPath = path.join(dir, `${id}.log.txt`);

  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The local Playwright test runner is disabled in production. Run the TrialIQ app locally.");
    }
    if (!process.env.PLAYWRIGHT_EMAIL || !process.env.PLAYWRIGHT_PASSWORD) {
      throw new Error("PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD must be configured once in .env.local. The web test page never asks for them.");
    }

    await fs.mkdir(dir, { recursive: true });
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL || request.nextUrl.origin,
      PLAYWRIGHT_HEADLESS: "true",
      PLAYWRIGHT_REPORT_FILE: reportFile,
      PLAYWRIGHT_RESULT_FILE: resultFile,
    };

    const processResult = await runPlaywright(
      ["playwright", "test", "tests/e2e/ai-quality-benchmark.spec.ts", "--project=chromium"],
      env
    );

    const completed = new Date();
    let playwrightJson: any = null;
    let aiResult: any = null;
    try { playwrightJson = JSON.parse(await fs.readFile(reportFile, "utf8")); } catch {}
    try { aiResult = JSON.parse(await fs.readFile(resultFile, "utf8")); } catch {}

    const tests = flattenPlaywrightTests(playwrightJson);
    const total = 25;
    const passed = tests.filter((test) => test.passed).length;
    const failed = total - passed;
    const error = processResult.code === 0
      ? undefined
      : tests.find((test) => !test.passed)?.error || processResult.stderr.trim() || `Playwright exited with code ${processResult.code}`;
    const logs = `${processResult.stdout}${processResult.stderr ? `\n${processResult.stderr}` : ""}`;

    const report = {
      id,
      startedAt: started.toISOString(),
      completedAt: completed.toISOString(),
      durationMs: completed.getTime() - started.getTime(),
      status: processResult.code === 0 && passed === total ? "PASS" : "FAIL",
      total,
      passed,
      failed,
      result: aiResult,
      tests,
      error,
      logs,
      logFile: `${id}.log.txt`,
    };

    await fs.writeFile(logPath, logs, "utf8");
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    const completed = new Date();
    const message = error instanceof Error ? error.message : String(error);
    const report = {
      id,
      startedAt: started.toISOString(),
      completedAt: completed.toISOString(),
      durationMs: completed.getTime() - started.getTime(),
      status: "FAIL",
      total: 25,
      passed: 0,
      failed: 25,
      result: null,
      tests: [],
      error: message,
      logs: message,
    };
    await fs.mkdir(dir, { recursive: true }).catch(() => undefined);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8").catch(() => undefined);
    return NextResponse.json({ ok: false, report }, { status: 500 });
  }
}
