import { NextResponse } from "next/server";
import { analyzeClinicalIntelligence } from "@/lib/clinicalIntelligence";
import { hardenClinicalIntelligence } from "@/lib/clinicalIntelligenceGuardrails";
import { addClinicalAuditMetadata } from "@/lib/clinicalAudit";
import { createClient } from "@/lib/supabase/server";

function priorityScore(value: string) {
  if (/critical/i.test(value)) return "Critical";
  if (/high|immediate/i.test(value)) return "High";
  return "Moderate";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const evidencePack = body?.evidencePack;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    if (!evidencePack) return NextResponse.json({ success: false, message: "Evidence pack is required." }, { status: 400 });

    const raw = await analyzeClinicalIntelligence(evidencePack);
    const result = addClinicalAuditMetadata(hardenClinicalIntelligence(raw), "Clinical Intelligence");
    const now = new Date().toISOString();
    const studyId = typeof body?.studyId === "string" ? body.studyId : null;
    const participantId = typeof body?.participantId === "string" ? body.participantId : null;

    const { data: parent, error: parentError } = await supabase.from("findings").insert({
      owner_id: user.id,
      study_id: studyId,
      participant_id: participantId,
      analysis_type: "Clinical Intelligence",
      title: result.executiveDecision || "Clinical intelligence review completed",
      summary: result.executiveSummary || "Clinical intelligence analysis completed.",
      confidence: typeof result.confidence === "number" ? result.confidence : null,
      status: result.decisionReadiness || "Review Required",
      priority: priorityScore(result.decisionReadiness || "Moderate"),
      evidence_quality: result.evidenceQuality || null,
      source_reference: "Clinical Intelligence evidence pack",
      metadata: { kind: "analysis", evidencePack, result, saved_at: now },
      source_ids: Array.isArray(result.audit?.sourceReferences) ? result.audit.sourceReferences : [],
    }).select("id").single();
    if (parentError) throw parentError;

    const findings = Array.isArray(result.priorityFindings) ? result.priorityFindings : [];
    if (findings.length) {
      const childRows = findings.map((finding: any) => ({
        owner_id: user.id,
        study_id: studyId,
        participant_id: participantId,
        parent_finding_id: parent.id,
        analysis_type: "Clinical Intelligence Finding",
        title: String(finding.title || finding.finding || "Clinical finding"),
        summary: String(finding.finding || finding.interpretation || ""),
        confidence: typeof finding.confidence === "number" ? finding.confidence : null,
        status: String(finding.status || "Requires Review"),
        priority: priorityScore(String(finding.priority || "Moderate")),
        evidence_quality: result.evidenceQuality || null,
        source_reference: Array.isArray(finding.evidence) ? finding.evidence.map((item: any) => item.sourceId).filter(Boolean).join(", ") : null,
        source_ids: Array.isArray(finding.evidence) ? finding.evidence.map((item: any) => item.sourceId).filter(Boolean) : [],
        tags: [String(finding.status || "").toLowerCase(), String(finding.priority || "").toLowerCase()].filter(Boolean),
        metadata: { kind: "priority_finding", parentFindingId: parent.id, whyItMatters: finding.whyItMatters, interpretation: finding.interpretation, missingEvidence: finding.missingEvidence || [], recommendedAction: finding.recommendedAction, evidence: finding.evidence || [] },
      }));
      const { error: childError } = await supabase.from("findings").insert(childRows);
      if (childError) console.error("Priority finding persistence error:", childError);
    }

    return NextResponse.json({ success: true, result, persisted: true, findingId: parent.id });
  } catch (error: any) {
    console.error("Clinical Intelligence API Error:", error);
    return NextResponse.json({ success: false, message: error?.status === 503 ? "Gemini is busy. Please try again." : error?.message || "Clinical intelligence analysis failed." }, { status: error?.status || 500 });
  }
}
