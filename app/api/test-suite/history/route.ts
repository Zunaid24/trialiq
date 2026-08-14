import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const dir = path.join(process.cwd(), "test-reports", "web-runs");
  try {
    const names = await fs.readdir(dir);
    const reportNames = names.filter((name) => name.endsWith(".json") && !name.endsWith(".playwright.json") && !name.endsWith(".result.json"));
    const reports = [];
    for (const name of reportNames) {
      try {
        const report = JSON.parse(await fs.readFile(path.join(dir, name), "utf8"));
        if (!report.id || !report.startedAt) continue;
        reports.push({
          id: report.id,
          suite: report.suite,
          suiteKey: report.suiteKey,
          startedAt: report.startedAt,
          completedAt: report.completedAt,
          durationMs: report.durationMs,
          status: report.status,
          total: report.total,
          passed: report.passed,
          failed: report.failed,
          aiReview: report.aiReview ? { status: report.aiReview.status, overallScore: report.aiReview.overallScore ?? null, model: report.aiReview.model } : undefined,
          error: report.error,
        });
      } catch {}
    }
    reports.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}
