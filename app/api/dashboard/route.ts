import { NextResponse } from "next/server";
import { getDashboardState } from "@/lib/dashboardStore";

export async function GET() {
  try {
    const state = getDashboardState();

    return NextResponse.json({
      success: true,

      data: {
        study: {
          id: "TRIALIQ-001",
          name: "TrialIQ Demo Study",
          status: "Active",
        },

        kpis: state.kpis,

        health: state.health,

        actions: state.actions,

        activity: state.activity,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load dashboard data.",
      },
      {
        status: 500,
      }
    );
  }
}