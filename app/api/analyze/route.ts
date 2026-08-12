import { NextResponse } from "next/server";
import { analyzeClinicalTrial } from "@/lib/gemini";
import { addClinicalAuditMetadata } from "@/lib/clinicalAudit";
import { hardenClinicalOutput } from "@/lib/clinicalOutputGuardrails";

export async function POST(req: Request) {
  try {
    const { protocol, participant } = await req.json();

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

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Analyze API Error:", error);

    return NextResponse.json(
      { success: false, message: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
