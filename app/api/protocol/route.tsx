import { NextResponse } from "next/server";
import { analyzeProtocol } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { protocol } = await req.json();

    const result = await analyzeProtocol(protocol);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
  console.error(error);

  return NextResponse.json(
    {
      success: false,
      message:
        error?.status === 503
          ? "Gemini is busy. Please try again in a few seconds."
          : "Protocol analysis failed.",
    },
    {
      status: error?.status || 500,
    }
  );
}
}