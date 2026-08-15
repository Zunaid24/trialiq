import { NextResponse } from "next/server";
import { getTestRunStore } from "@/lib/testRunStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = getTestRunStore();
    const [{ data: runs, error: runError }, { data: jobs, error: jobError }] = await Promise.all([
      store
        .from("test_runs")
        .select("id,run_key,suite,suite_key,started_at,completed_at,duration_ms,status,total,passed,failed,skipped,flaky,ai_review,error")
        .order("started_at", { ascending: false })
        .limit(100),
      store
        .from("test_run_jobs")
        .select("id,suite,status,requested_at,started_at,completed_at,run_id,error,metadata")
        .in("status", ["QUEUED", "RUNNING", "FAILED"])
        .order("requested_at", { ascending: false })
        .limit(100),
    ]);

    if (runError) throw runError;
    if (jobError) throw jobError;

    const reports = (runs || []).map((run) => ({
      id: run.id,
      runKey: run.run_key,
      suite: run.suite,
      suiteKey: run.suite_key,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      requestedAt: run.started_at,
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
      kind: "RUN",
    }));

    const runIds = new Set(reports.map((report) => report.id));
    const queued = (jobs || [])
      .filter((job) => !job.run_id || !runIds.has(job.run_id))
      .map((job) => ({
        id: job.id,
        jobId: job.id,
        runId: job.run_id,
        runKey: undefined,
        suite: job.suite === "ui" ? "UI Quality" : "AI Quality Benchmark",
        suiteKey: job.suite,
        startedAt: job.started_at || job.requested_at,
        completedAt: job.completed_at,
        requestedAt: job.requested_at,
        durationMs: 0,
        status: job.status === "RUNNING" ? "RUNNING" : job.status === "QUEUED" ? "QUEUED" : "FAIL",
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0,
        aiReview: undefined,
        error: job.error,
        kind: "JOB",
      }));

    reports.push(...queued);
    reports.sort((a, b) => new Date(b.requestedAt || b.startedAt || 0).getTime() - new Date(a.requestedAt || a.startedAt || 0).getTime());

    return NextResponse.json({ reports: reports.slice(0, 100) });
  } catch (error) {
    return NextResponse.json(
      { reports: [], error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
