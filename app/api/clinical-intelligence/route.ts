import { NextResponse } from "next/server";
import { analyzeClinicalIntelligence } from "@/lib/clinicalIntelligence";
import { hardenClinicalIntelligence } from "@/lib/clinicalIntelligenceGuardrails";
import { addClinicalAuditMetadata } from "@/lib/clinicalAudit";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const evidencePack = body?.evidencePack;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    if (!evidencePack) {
      return NextResponse.json({ success: false, message: "Evidence pack is required." }, { status: 400 });
    }

    const raw = await analyzeClinicalIntelligence(evidencePack);
    const result = addClinicalAuditMetadata(
      hardenClinicalIntelligence(raw),
      "Clinical Intelligence"
    );

    const title = result.executiveDecision || "Clinical intelligence review completed";
    const summary = result.executiveSummary || "Clinical intelligence analysis completed.";
    const { error: saveError } = await supabase.from("findings").insert({
      owner_id: user.id,
      analysis_type: "Clinical Intelligence",
      title,
      summary,
      confidence: typeof result.confidence === "number" ? result.confidence : null,
      status: result.decisionReadiness || "new",
      source_reference: "Clinical Intelligence evidence pack",
      metadata: {
        evidencePack,
        result,
        saved_at: new Date().toISOString(),
      },
    });

    if (saveError) console.error("Clinical Intelligence persistence error:", saveError);

    return NextResponse.json({ success: true, result, persisted: !saveError });
  } catch (error: any) {
    console.error("Clinical Intelligence API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.status === 503 ? "Gemini is busy. Please try again." : "Clinical intelligence analysis failed.",
      },
      { status: error?.status || 500 }
    );
  }
}
