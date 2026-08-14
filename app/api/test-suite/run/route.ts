import { NextRequest, NextResponse } from "next/server";
import { getTestRunStore } from "@/lib/testRunStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Suite = "ai" | "ui";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const suite: Suite = body?.suite === "ui" ? "ui" : "ai";
    const store = getTestRunStore();

    const { data: activeJobs, error: activeError } = await store
      .from("test_run_jobs")
      .select("id,suite,status")
      .in("status", ["QUEUED", "RUNNING"])
      .limit(1);

    if (activeError) throw activeError;
    if (activeJobs?.length) {
      return NextResponse.json({ ok: false, error: "A quality run is already queued or running. Open its result page or wait for it to finish." }, { status: 409 });
    }

    const { data, error } = await store
      .from("test_run_jobs")
      .insert({
        suite,
        status: "QUEUED",
        metadata: {
          requestedFrom: request.nextUrl.origin,
          requestedPath: "/test.html",
          userAgent: request.headers.get("user-agent"),
        },
      })
      .select("id,suite,status,requested_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      job: { id: data.id, suite: data.suite, status: data.status, requestedAt: data.requested_at },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
