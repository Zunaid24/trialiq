import { NextResponse } from "next/server";
import { getTestRunStore } from "@/lib/testRunStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid run id" }, { status: 400 });

  try {
    const store = getTestRunStore();
    const [{ data: run, error: runError }, { data: tests, error: testsError }, { data: reviews, error: reviewsError }] = await Promise.all([
      store.from("test_runs").select("*").eq("id", id).maybeSingle(),
      store.from("test_results").select("*").eq("run_id", id).order("test_number", { ascending: true }),
      store.from("test_ai_reviews").select("*").eq("run_id", id).order("test_number", { ascending: true }),
    ]);

    if (runError) throw runError;
    if (testsError) throw testsError;
    if (reviewsError) throw reviewsError;
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

    const reviewByNumber = new Map((reviews || []).map((review) => [review.test_number, review]));
    const report = {
      id: run.id,
      runKey: run.run_key,
      suite: run.suite,
      suiteKey: run.suite_key,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      durationMs: run.duration_ms,
      status: run.status,
      total: run.total,
      passed: run.passed,
      failed: run.failed,
      skipped: run.skipped,
      flaky: run.flaky,
      workerCount: run.worker_count,
      browser: run.browser,
      baseUrl: run.base_url,
      gitCommit: run.git_commit,
      suiteVersion: run.suite_version,
      command: run.command,
      result: run.raw_suite_result,
      tests: (tests || []).map((test) => ({
        id: test.test_number,
        testId: test.test_id,
        name: test.test_name,
        file: test.test_file,
        line: test.test_line,
        passed: test.status === "PASS",
        status: test.status,
        durationMs: test.duration_ms,
        error: test.error_message,
        errorStack: test.error_stack,
        locator: test.locator,
        expected: test.expected,
        received: test.received,
        callLog: test.call_log,
        stdout: test.stdout,
        stderr: test.stderr,
        evidence: test.evidence,
        rawResult: test.raw_result,
      })),
      aiReview: run.ai_review
        ? run.ai_review
        : {
            status: reviews?.length ? "COMPLETE" : "PENDING",
            model: null,
            overallScore: null,
            overallSummary: null,
            reviews: (reviews || []).map((review) => ({
              testId: review.test_number,
              score: review.score,
              verdict: review.verdict,
              rootCauseLayer: review.root_cause_layer,
              rootCauseConfidence: review.root_cause_confidence,
              isProductDefect: review.is_product_defect,
              strengths: review.strengths,
              issues: review.issues,
              recommendations: review.recommendations,
              reviewNotes: review.review_notes,
            })),
          },
      error: run.error,
      logs: run.raw_console_output,
      createdAt: run.created_at,
    };

    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
