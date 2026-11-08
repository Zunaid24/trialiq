import type { SupabaseClient } from "@supabase/supabase-js";

// Saves one module run (eligibility, labs, meds…) so Today, Review and Reports can see it.
// Failures are logged and never block returning the analysis to the user.
export async function persistModuleRun(
  supabase: SupabaseClient,
  module: string,
  result: Record<string, unknown> & { executiveSummary?: string; confidence?: number },
  opts: { participantCode?: string | null; title?: string; status?: string } = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const confidence = typeof result.confidence === "number" ? (result.confidence > 1 ? result.confidence / 100 : result.confidence) : null;
    const { data, error } = await supabase.from("findings").insert({
      owner_id: user.id,
      analysis_type: module,
      title: opts.title || `${module} completed`,
      summary: typeof result.executiveSummary === "string" ? result.executiveSummary : null,
      confidence,
      status: opts.status || "Requires Review",
      priority: "Moderate",
      source_reference: module,
      metadata: { kind: "module_run", module, participantCode: opts.participantCode ?? null, result, saved_at: new Date().toISOString() },
    }).select("id").single();
    if (error) { console.error(`${module} persistence error:`, error); return null; }
    return data.id as string;
  } catch (error) {
    console.error(`${module} persistence error:`, error);
    return null;
  }
}
