import { NextResponse } from "next/server";
import { analyzeAdverseEvent } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const {
      document,
      fileName,
    } = await req.json();

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Adverse event document is required.",
        },
        { status: 400 }
      );
    }

    const result = await analyzeAdverseEvent(
      document,
      fileName
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error(
      "Adverse Event API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.status === 503
            ? "Gemini is busy. Please try again."
            : "Adverse event analysis failed.",
      },
      {
        status: error?.status || 500,
      }
    );
  }
}