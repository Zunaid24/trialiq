import { NextResponse } from "next/server";
import { analyzeClinicalTrial } from "@/lib/gemini";
import { addClinicalAuditMetadata } from "@/lib/clinicalAudit";
import { hardenClinicalOutput } from "@/lib/clinicalOutputGuardrails";
import { createClient } from "@/lib/supabase/server";
import { persistModuleRun } from "@/lib/persistModuleRun";

export async function POST(req: Request) {
  try {
    const { protocol, participant, participantCode } = await req.json();

    if (!protocol || !participant) {
      return NextResponse.json(
        { success: false, message: "Protocol and participant data are required." },
        { status: 400 }
      );
    }

    const result = addClinicalAuditMetadata(
      hardenClinicalOutput(
        "Eligibility Screening",
        await analyzeClinicalTrial(protocol, participant),
        `${protocol}\n\n${participant}`
      ),
      "Eligibility Screening"
    );

    const supabase = await createClient();
    const failed = (result.criteriaEvaluation?.inclusion ?? []).concat(result.criteriaEvaluation?.exclusion ?? []).filter((c: any) => /not met/i.test(String(c.status))).length;
    const runId = await persistModuleRun(supabase, "Eligibility Screening", result, {
      participantCode: participantCode || result.participantId || null,
      title: `${participantCode || result.participantId || "Participant"}: ${failed ? `${failed} criteria not met` : "eligibility checked"}`,
      status: failed ? "Not Decision-Ready" : "Review Required",
    });

    return NextResponse.json({ success: true, result, runId });
  } catch (error) {
    console.error("Analyze API Error:", error);

    return NextResponse.json(
      { success: false, message: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
