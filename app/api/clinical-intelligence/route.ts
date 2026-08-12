import { NextResponse } from "next/server";
import { analyzeClinicalIntelligence } from "@/lib/clinicalIntelligence";
import { hardenClinicalIntelligence } from "@/lib/clinicalIntelligenceGuardrails";
import { addClinicalAuditMetadata } from "@/lib/clinicalAudit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const evidencePack = body?.evidencePack;

    if (!evidencePack) {
      return NextResponse.json({ success: false, message: "Evidence pack is required." }, { status: 400 });
    }

    const raw = await analyzeClinicalIntelligence(evidencePack);
    const result = addClinicalAuditMetadata(
      hardenClinicalIntelligence(raw),
      "Clinical Intelligence"
    );

    return NextResponse.json({ success: true, result });
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
