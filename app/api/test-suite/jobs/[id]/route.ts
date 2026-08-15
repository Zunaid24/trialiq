import { NextResponse } from "next/server";
import { getTestRunStore } from "@/lib/testRunStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid job id" }, { status: 400 });

  try {
    const store = getTestRunStore();
    const { data, error } = await store
      .from("test_run_jobs")
      .select("id,suite,status,requested_at,started_at,completed_at,run_id,error,runner_id")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    return NextResponse.json({ job: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Request termination of a queued/running local quality job.
 *
 * QUEUED jobs can be cancelled immediately. RUNNING jobs are marked
 * CANCEL_REQUESTED; the local runner polls that state and kills the
 * Playwright process tree before marking the job CANCELLED.
 */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid job id" }, { status: 400 });

  try {
    const store = getTestRunStore();
    const { data: current, error: readError } = await store
      .from("test_run_jobs")
      .select("id,suite,status,requested_at,started_at,completed_at,run_id,error,runner_id")
      .eq("id", id)
      .maybeSingle();

    if (readError) throw readError;
    if (!current) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    if (current.status === "QUEUED") {
      const { data, error } = await store
        .from("test_run_jobs")
        .update({
          status: "CANCELLED",
          completed_at: new Date().toISOString(),
          error: "Cancelled by user before the local runner started.",
        })
        .eq("id", id)
        .eq("status", "QUEUED")
        .select("id,suite,status,requested_at,started_at,completed_at,run_id,error,runner_id")
        .single();

      if (error) throw error;
      return NextResponse.json({ job: data });
    }

    if (current.status === "RUNNING" || current.status === "CANCEL_REQUESTED") {
      const { data, error } = await store
        .from("test_run_jobs")
        .update({
          status: "CANCEL_REQUESTED",
          error: "Termination requested by user.",
        })
        .eq("id", id)
        .in("status", ["RUNNING", "CANCEL_REQUESTED"])
        .select("id,suite,status,requested_at,started_at,completed_at,run_id,error,runner_id")
        .single();

      if (error) throw error;
      return NextResponse.json({ job: data });
    }

    return NextResponse.json(
      { error: `This job is already ${String(current.status).toLowerCase()}.`, job: current },
      { status: 409 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
