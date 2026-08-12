import { NextResponse } from "next/server";
import { analyzeVisitIntelligence } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { protocol } = await req.json();

    if (!protocol) {
      return NextResponse.json(
        {
          success: false,
          message: "Protocol is required.",
        },
        { status: 400 }
      );
    }

    const result =
      await analyzeVisitIntelligence(protocol);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error(
      "Visit Intelligence API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.status === 503
            ? "Gemini is busy. Please try again."
            : "Visit intelligence analysis failed.",
      },
      {
        status: error?.status || 500,
      }
    );
  }
}