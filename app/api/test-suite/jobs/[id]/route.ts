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
