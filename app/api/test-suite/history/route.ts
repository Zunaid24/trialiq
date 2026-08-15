import { NextResponse } from "next/server";
import { getTestRunStore } from "@/lib/testRunStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = getTestRunStore();

    const [{ data: runs, error: runsError }, { data: jobs, error: jobsError }] = await Promise.all([
      store
        .from("test_runs")
        .select("id,run_key,suite,suite_key,started_at,completed_at,duration_ms,status,total,passed,failed,skipped,flaky,ai_review,error")
        .order("started_at", { ascending: false })
        .limit(100),
      store
        .from("test_run_jobs")
        .select("id,suite,status,requested_at,started_at,completed_at,run_id,error")
        .in("status", ["QUEUED", "RUNNING"])
        .order("requested_at", { ascending: false })
        .limit(50),
    ]);

    if (runsError) throw runsError;
    if (jobsError) throw jobsError;

    const reports = (runs || []).map((run) => ({
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
      aiReview: run.ai_review
        ? {
            status: run.ai_review.status,
            overallScore: run.ai_review.overallScore ?? null,
            model: run.ai_review.model,
          }
        : undefined,
      error: run.error,
      kind: "RESULT",
    }));

    const queued = (jobs || []).map((job) => ({
      id: job.id,
      jobId: job.id,
      runId: job.run_id,
      suite: job.suite === "ui" ? "UI Quality" : "AI Quality Benchmark",
      suiteKey: job.suite === "ui" ? "ui" : "ai",
      startedAt: job.started_at || job.requested_at,
      completedAt: job.completed_at || job.requested_at,
      requestedAt: job.requested_at,
      durationMs: 0,
      status: job.status,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0,
      error: job.error,
      kind: "JOB",
    }));

    reports.push(...queued);
    reports.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json(
      { reports: [], error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
