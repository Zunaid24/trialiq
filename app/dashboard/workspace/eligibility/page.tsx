"use client";

import OverviewCard from "@/components/OverviewCard";
import EvidenceTable from "@/components/EvidenceTable";
import Recommendations from "@/components/Recommendations";
import WorkspaceTabs from "@/components/WorkspaceTabs";
import { useState } from "react";
import { FileText, UserRound, Sparkles } from "lucide-react";
import AnalysisReport from "@/components/AnalysisReport";
import { extractPdfText } from "@/lib/extractPdfText";
export default function Home() {
  const [protocolFile, setProtocolFile] = useState<File | null>(null);
  const [participantFile, setParticipantFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16">

        {/* Header */}

        <div className="text-center">

          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm shadow-sm">
            <Sparkles size={16} className="text-blue-600" />
            AI-powered Clinical Trial Screening Intelligence
          </div>

          <h1 className="mt-8 text-6xl font-bold tracking-tight">
            TrialIQ AI
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600">
            Upload a Clinical Trial Protocol and a Participant Medical Summary.
            TrialIQ compares both documents using AI and generates explainable
            eligibility assessments with research insights.
          </p>

        </div>

        {/* Upload Cards */}

        <div className="mt-16 grid gap-8 md:grid-cols-2">

          <label className="cursor-pointer rounded-3xl border bg-white p-8 shadow-sm transition hover:shadow-md">

            <FileText
              className="mb-6 text-blue-600"
              size={40}
            />

            <h2 className="text-2xl font-semibold">
              Clinical Trial Protocol
            </h2>

            <p className="mt-3 text-gray-500">
              Upload protocol PDF
            </p>

            <div className="mt-8 rounded-2xl border-2 border-dashed py-16 text-center">

              {protocolFile ? (
                <div>

                  <p className="font-semibold text-green-600">
                    ✓ {protocolFile.name}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    {(protocolFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                </div>
              ) : (
                <div>

                  <p className="text-lg font-medium">
                    Drop PDF here
                  </p>

                  <p className="mt-2 text-gray-500">
                    or click to browse
                  </p>

                </div>
              )}

            </div>

            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) =>
                setProtocolFile(e.target.files?.[0] ?? null)
              }
            />

          </label>

          <label className="cursor-pointer rounded-3xl border bg-white p-8 shadow-sm transition hover:shadow-md">

            <UserRound
              className="mb-6 text-blue-600"
              size={40}
            />

            <h2 className="text-2xl font-semibold">
              Participant Medical Summary
            </h2>

            <p className="mt-3 text-gray-500">
              Upload participant PDF
            </p>

            <div className="mt-8 rounded-2xl border-2 border-dashed py-16 text-center">

              {participantFile ? (
                <div>

                  <p className="font-semibold text-green-600">
                    ✓ {participantFile.name}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    {(participantFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                </div>
              ) : (
                <div>

                  <p className="text-lg font-medium">
                    Drop PDF here
                  </p>

                  <p className="mt-2 text-gray-500">
                    or click to browse
                  </p>

                </div>
              )}

            </div>

            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) =>
                setParticipantFile(e.target.files?.[0] ?? null)
              }
            />

          </label>

        </div>

       <button
  disabled={!protocolFile || !participantFile}
  onClick={async () => {
    if (!protocolFile || !participantFile) return;

    try {
      setLoading(true);

      const protocolText = await extractPdfText(protocolFile);
      const participantText = await extractPdfText(participantFile);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          protocol: protocolText,
          participant: participantText,
        }),
      });

      const data = await response.json();

      setLoading(false);

      if (!data.success) {
        alert(data.message);
        return;
      }

      setReport(data.result);
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  }}
  className={`mx-auto mt-12 rounded-2xl px-10 py-4 text-lg font-semibold transition ${
    protocolFile && participantFile
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "cursor-not-allowed bg-gray-300 text-gray-500"
  }`}
>
  Analyze Eligibility
</button>
  

{loading && (
  <div className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold">
      AI is analyzing your documents...
    </h2>

    <p className="mt-2 text-gray-500">
      Comparing protocol, evaluating eligibility and generating insights...
    </p>
  </div>
)}

{report && (
  <div className="mt-10 space-y-8">

    <WorkspaceTabs active="overview" />

    <OverviewCard report={report} />

    <EvidenceTable report={report} />

    <Recommendations report={report} />

  </div>
)}

      </div><div className="mb-10">

    <h1 className="text-4xl font-bold">
        Eligibility Screening
    </h1>

    <p className="mt-3 text-slate-500">
        AI compares clinical trial protocols with participant records to determine eligibility.
    </p>

</div>

<WorkspaceTabs active="overview" />
    </main>
  );
}