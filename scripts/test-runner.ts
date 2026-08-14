import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import dotenv from "dotenv";
import { getTestRunnerStore, getTestRunnerConfig } from "../lib/testRunStore";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: false });

async function main() {
  const { reviewQualitySuite } = await import("../lib/testAiReviewer");
  const store = getTestRunnerStore();
  const { baseUrl, runnerId, pollMs } = getTestRunnerConfig();
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "trialiq-quality-"));

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function runId() {
    return new Date().toISOString().replace("T", "_").replace(/:/g, "-").replace(/\.\d{3}Z$/, "Z");
  }

  function errorMessage(error: unknown) {
    if (error instanceof Error) return error.stack || error.message;
    if (typeof error === "string") return error;
    try { const serialized = JSON.stringify(error); return serialized === undefined ? String(error) : serialized; } catch { return String(error); }
  }

  function normalizeConfidence(value: unknown) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    const percentage = numeric >= 0 && numeric <= 1 ? numeric * 100 : numeric;
    return Math.max(0, Math.min(100, Math.round(percentage)));
  }

  async function runPlaywright(spec: string, env: NodeJS.ProcessEnv) {
    return new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
      // On Windows, .cmd shims such as npx.cmd cannot be spawned reliably with shell:false.
      // Invoke cmd.exe explicitly so the child process is still controlled without Node's shell:true.
      const command = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "npx";
      const args = process.platform === "win32"
        ? ["/d", "/s", "/c", "npx playwright test " + spec + " --project=chromium"]
        : ["playwright", "test", spec, "--project=chromium"];
      const child = spawn(command, args, { cwd: process.cwd(), env, windowsHide: true, shell: false, stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      let settled = false;
      const finish = (code: number) => { if (settled) return; settled = true; resolve({ code, stdout, stderr }); };
      child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
      child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
      child.on("error", (error) => { stderr += `\n[runner spawn error] ${errorMessage(error)}`; finish(1); });
      child.on("close", (code) => finish(code ?? 1));
    });
  }

  function flattenPlaywrightTests(value: any, output: any[] = []) {
    if (!value) return output;
    for (const spec of value.specs || []) {
      for (const test of spec.tests || []) {
        const results = test.results || [];
        const last = results[results.length - 1];
        const status = last?.status || test.status || "skipped";
        const errorObject = last?.error || last?.errors?.[0];
        output.push({
          testNumber: Number(String(spec.title).match(/^(\d+)/)?.[1] || output.length + 1),
          testId: String(test.testId || ""),
          testName: spec.title,
          testFile: spec.file,
          status: status === "passed" ? "PASS" : status === "failed" ? "FAIL" : status === "skipped" ? "SKIP" : "FLAKY",
          passed: status === "passed",
          durationMs: Number(last?.duration || 0),
          errorMessage: errorObject?.message || errorObject?.value || undefined,
          errorStack: errorObject?.stack || undefined,
          rawResult: last || test,
        });
      }
    }
    for (const suite of value.suites || []) flattenPlaywrightTests(suite, output);
    return output;
  }

  async function loadUiEvidence(dir: string, tests: any[]) {
    return Promise.all(tests.map(async (test) => {
      const id = String(test.testNumber).padStart(2, "0");
      try {
        const metadata = JSON.parse(await fs.readFile(path.join(dir, `${id}.json`), "utf8"));
        let screenshotBase64: string | undefined;
        try { screenshotBase64 = (await fs.readFile(path.join(dir, `${id}.jpg`))).toString("base64"); } catch {}
        return { ...test, evidence: { url: metadata.url, visibleText: metadata.visibleText, controls: metadata.controls, screenshotBase64 } };
      } catch { return test; }
    }));
  }

  async function processJob(job: any) {
    const started = new Date();
    const id = runId();
    const suiteKey = job.suite === "ui" ? "ui" : "ai";
    const suiteName = suiteKey === "ui" ? "UI Quality" : "AI Quality Benchmark";
    const spec = suiteKey === "ui" ? "tests/e2e/ui-quality.spec.ts" : "tests/e2e/ai-quality-benchmark.spec.ts";
    const jobDir = path.join(root, job.id);
    const evidenceDir = path.join(jobDir, "evidence");
    const reportFile = path.join(jobDir, "playwright.json");
    const resultFile = path.join(jobDir, "suite-result.json");
    await fs.mkdir(evidenceDir, { recursive: true });

    const env: NodeJS.ProcessEnv = { ...process.env, PLAYWRIGHT_BASE_URL: baseUrl, PLAYWRIGHT_HEADLESS: "true", PLAYWRIGHT_REPORT_FILE: reportFile, PLAYWRIGHT_RESULT_FILE: resultFile, PLAYWRIGHT_EVIDENCE_DIR: evidenceDir, PLAYWRIGHT_OUTPUT_DIR: path.join(jobDir, "artifacts") };
    let processResult = { code: 1, stdout: "", stderr: "" };
    let playwrightJson: any = null;
    let suiteResult: any = null;
    let aiReview: any = null;

    try {
      processResult = await runPlaywright(spec, env);
      try { playwrightJson = JSON.parse(await fs.readFile(reportFile, "utf8")); } catch {}
      try { suiteResult = JSON.parse(await fs.readFile(resultFile, "utf8")); } catch {}
      const tests = flattenPlaywrightTests(playwrightJson);
      const evidenceTests = suiteKey === "ui" ? await loadUiEvidence(evidenceDir, tests) : tests;
      const logs = `${processResult.stdout}${processResult.stderr ? `\n${processResult.stderr}` : ""}`.trim();
      const total = tests.length;
      const passed = tests.filter((test) => test.passed).length;
      const failed = tests.filter((test) => test.status === "FAIL").length;
      const skipped = tests.filter((test) => test.status === "SKIP").length;
      const flaky = tests.filter((test) => test.status === "FLAKY").length;

      try {
        aiReview = await reviewQualitySuite({ suite: suiteName, tests: evidenceTests, aiResult: suiteResult });
      } catch (error) {
        aiReview = { status: "ERROR", model: process.env.TEST_REVIEW_MODEL || "gemini-3.6-flash", overallScore: null, overallSummary: "Automated tests completed, but the AI review layer failed.", reviews: [], error: errorMessage(error) };
      }

      const completed = new Date();
      const runStatus = processResult.code === 0 && total > 0 && failed === 0 ? "PASS" : "FAIL";
      const { data: run, error: runError } = await store.from("test_runs").insert({ job_id: job.id, run_key: id, suite: suiteName, suite_key: suiteKey, started_at: started.toISOString(), completed_at: completed.toISOString(), duration_ms: completed.getTime() - started.getTime(), status: runStatus, total, passed, failed, skipped, flaky, worker_count: 1, browser: "chromium", base_url: baseUrl, git_commit: process.env.GIT_COMMIT || undefined, suite_version: process.env.TEST_SUITE_VERSION || "local-runner", command: `playwright test ${spec} --project=chromium`, raw_console_output: logs, raw_playwright_result: playwrightJson, raw_suite_result: suiteResult, ai_review: aiReview, error: failed ? tests.find((test) => !test.passed)?.errorMessage || logs : processResult.code !== 0 ? logs : null }).select("id").single();
      if (runError || !run) throw runError || new Error("Test run was not created.");

      const testRows = tests.map((test) => ({ run_id: run.id, test_number: test.testNumber, test_id: test.testId, test_name: test.testName, test_file: test.testFile, status: test.status, duration_ms: test.durationMs, error_message: test.errorMessage || null, error_stack: test.errorStack || null, evidence: evidenceTests.find((item) => item.testNumber === test.testNumber)?.evidence || {}, raw_result: test.rawResult }));
      if (testRows.length) {
        const { data: insertedTests, error: testError } = await store.from("test_results").insert(testRows).select("id,test_number");
        if (testError) throw testError;
        const testResultId = new Map((insertedTests || []).map((row) => [row.test_number, row.id]));
        const reviews = Array.isArray(aiReview?.reviews) ? aiReview.reviews : [];
        const reviewRows = reviews.map((review: any) => ({ run_id: run.id, test_result_id: testResultId.get(Number(review.testId)) || null, test_number: Number(review.testId), score: review.score ?? null, verdict: review.verdict ?? null, root_cause_layer: review.rootCauseLayer ?? null, root_cause_confidence: normalizeConfidence(review.rootCauseConfidence), is_product_defect: review.isProductDefect ?? false, strengths: review.strengths || [], issues: review.issues || [], recommendations: review.recommendations || [], review_notes: review.reviewNotes || null, raw_review: review }));
        if (reviewRows.length) { const { error: reviewError } = await store.from("test_ai_reviews").insert(reviewRows); if (reviewError) throw reviewError; }
      }
      await store.from("test_run_jobs").update({ status: "COMPLETED", completed_at: completed.toISOString(), run_id: run.id, error: null }).eq("id", job.id);
      console.log(`[TrialIQ] ${suiteName}: ${runStatus} (${passed}/${total}) · run ${run.id}`);
    } catch (error) {
      const message = errorMessage(error);
      try { await store.from("test_run_jobs").update({ status: "FAILED", completed_at: new Date().toISOString(), error: message }).eq("id", job.id); }
      catch (updateError) { console.error(`[TrialIQ] Failed to persist job failure: ${errorMessage(updateError)}`); }
      console.error(`[TrialIQ] Job ${job.id} failed: ${message}`);
    } finally {
      await fs.rm(jobDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  console.log(`[TrialIQ] Local quality runner online: ${runnerId}`);
  console.log(`[TrialIQ] Product target: ${baseUrl}`);
  console.log(`[TrialIQ] Poll interval: ${pollMs}ms`);

  while (true) {
    try {
      const { data: job, error } = await store.rpc("claim_test_run_job", { p_runner_id: runnerId });
      if (error) throw error;
      if (job?.id) await processJob(job);
      else if (job && Object.values(job).some((value) => value !== null)) console.warn("[TrialIQ] Ignoring malformed job returned by claim_test_run_job:", JSON.stringify(job));
    } catch (error) { console.error("[TrialIQ] Polling error:", errorMessage(error)); }
    await sleep(pollMs);
  }
}

main().catch((error) => { console.error("[TrialIQ] Fatal runner error:", errorMessage(error)); process.exitCode = 1; });