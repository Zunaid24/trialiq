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
  return await new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const command = npxCommand();
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env,
      windowsHide: true,
      // Windows resolves npx.cmd much more reliably through the shell when
      // Playwright is launched from a Next.js server process.
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
    child.on("error", (error) => {
      stderr += `\n[runner spawn error] ${error.message}`;
      finish(1);
    });
    child.on("close", (code) => finish(code ?? 1));

    // Keep the HTTP request bounded while allowing the benchmark's own
    // 120-second Playwright timeout to finish normally.
    setTimeout(() => {
      if (!settled) {
        stderr += "\n[runner timeout] Playwright runner exceeded 170 seconds.";
        child.kill();
        finish(1);
      }
    }, 170_000);
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
    const logs = `${processResult.stdout}${processResult.stderr ? `\n${processResult.stderr}` : ""}`.trim();
    const error = processResult.code === 0 && passed === total
      ? undefined
      : tests.find((test) => !test.passed)?.error || logs || `Playwright exited with code ${processResult.code}`;

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

    // Always return the run report so the UI can open the timestamped result
    // page even when Playwright itself fails to launch or a gate fails.
    return NextResponse.json({ ok: report.status === "PASS", report });
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
    await fs.writeFile(logPath, message, "utf8").catch(() => undefined);

    // A benchmark failure is a test result, not a broken dashboard request.
    return NextResponse.json({ ok: false, report });
  }
}
