import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { persistModuleRun } from "@/lib/persistModuleRun";

// Latest saved run of a module, so a page shows the last result instead of an empty screen.
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  const url = new URL(req.url);
  const name = url.searchParams.get("module");
  if (!name) return NextResponse.json({ success: false, message: "module is required." }, { status: 400 });
  const { data, error } = await supabase
    .from("findings")
    .select("id,created_at,metadata,status")
    .eq("owner_id", user.id)
    .eq("analysis_type", name)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  const run = (data ?? []).find((r) => (r.metadata as { result?: unknown } | null)?.result);
  return NextResponse.json({ success: true, run: run ? { id: run.id, createdAt: run.created_at, status: run.status, result: (run.metadata as { result: unknown }).result } : null });
}

// Saves a module run so Today, Review and Reports can see it.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.module || !body?.result || typeof body.result !== "object") return NextResponse.json({ success: false, message: "module and result are required." }, { status: 400 });
  const result = body.result as Record<string, unknown>;
  const summary = [result.executiveSummary, result.summary, result.eventSummary, result.overallAssessment].find((v) => typeof v === "string") as string | undefined;
  const id = await persistModuleRun(supabase, String(body.module), { ...result, executiveSummary: summary }, {
    participantCode: body.participantCode ?? null,
    title: typeof body.title === "string" ? body.title.slice(0, 200) : undefined,
  });
  return NextResponse.json({ success: Boolean(id), runId: id });
}
