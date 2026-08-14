import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const dir = path.join(process.cwd(), "test-reports", "web-runs");
  try {
    const names = await fs.readdir(dir);
    const reports = [];
    for (const name of names.filter((n) => n.endsWith(".json"))) {
      try {
        const report = JSON.parse(await fs.readFile(path.join(dir, name), "utf8"));
        reports.push({
          id: report.id,
          startedAt: report.startedAt,
          completedAt: report.completedAt,
          durationMs: report.durationMs,
          status: report.status,
          total: report.total,
          passed: report.passed,
          failed: report.failed,
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
