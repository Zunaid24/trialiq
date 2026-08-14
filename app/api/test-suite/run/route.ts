import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { evaluateAiQuality } from "@/lib/ai-quality-benchmark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function runId(date: Date) {
  return date.toISOString().replace("T", "_").replace(/:/g, "-").replace(/\.\d{3}Z$/, "Z");
}

export async function POST(request: NextRequest) {
  const started = new Date();
  const id = runId(started);
  const cookie = request.headers.get("cookie") || "";
  const baseUrl = request.nextUrl.origin;
  const dir = path.join(process.cwd(), "test-reports", "web-runs");
  const file = path.join(dir, `${id}.json`);

  try {
    if (!cookie) {
      return NextResponse.json({ error: "You must be signed in to run the benchmark." }, { status: 401 });
    }

    await fs.mkdir(dir, { recursive: true });
    const sourceResponse = await fetch(`${baseUrl}/demo/clinical-intelligence-evidence.json`, { cache: "no-store" });
    if (!sourceResponse.ok) throw new Error(`Evidence pack request failed with HTTP ${sourceResponse.status}`);
    const evidencePack = await sourceResponse.json();

    const aiResponse = await fetch(`${baseUrl}/api/clinical-intelligence`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ evidencePack }),
      cache: "no-store",
    });

    const payload = await aiResponse.json().catch(() => null);
    if (!aiResponse.ok || !payload?.success) {
      throw new Error(payload?.message || `Clinical Intelligence API failed with HTTP ${aiResponse.status}`);
    }

    const tests = evaluateAiQuality(payload.result);
    const completed = new Date();
    const passed = tests.filter((t) => t.passed).length;
    const failed = tests.length - passed;
    const report = {
      id,
      startedAt: started.toISOString(),
      completedAt: completed.toISOString(),
      durationMs: completed.getTime() - started.getTime(),
      status: failed === 0 ? "PASS" : "FAIL",
      total: tests.length,
      passed,
      failed,
      result: payload.result,
      tests,
    };

    await fs.writeFile(file, JSON.stringify(report, null, 2), "utf8");
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    const completed = new Date();
    const report = {
      id,
      startedAt: started.toISOString(),
      completedAt: completed.toISOString(),
      durationMs: completed.getTime() - started.getTime(),
      status: "FAIL",
      total: 0,
      passed: 0,
      failed: 0,
      result: null,
      tests: [],
      error: error instanceof Error ? error.message : String(error),
    };
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(file, JSON.stringify(report, null, 2), "utf8");
    } catch {}
    const status = report.error.includes("signed in") ? 401 : 500;
    return NextResponse.json({ ok: false, report }, { status });
  }
}
