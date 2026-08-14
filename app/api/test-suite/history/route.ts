import { NextResponse } from "next/server";
import { getTestRunStore } from "@/lib/testRunStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = getTestRunStore();
    const { data, error } = await store
      .from("test_runs")
      .select("id,run_key,suite,suite_key,started_at,completed_at,duration_ms,status,total,passed,failed,skipped,flaky,ai_review,error")
      .order("started_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const reports = (data || []).map((run) => ({
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
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json(
      { reports: [], error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
