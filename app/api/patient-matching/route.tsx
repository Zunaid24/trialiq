import { NextResponse } from "next/server";
import { analyzePatientMatching } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { patient } = await req.json();

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          message: "Patient medical summary is required.",
        },
        { status: 400 }
      );
    }

    const result = await analyzePatientMatching(patient);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Patient Matching API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.status === 503
            ? "Gemini is busy. Please try again."
            : "Patient matching failed.",
      },
      { status: error?.status || 500 }
    );
  }
}