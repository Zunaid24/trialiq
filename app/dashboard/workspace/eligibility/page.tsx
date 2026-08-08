"use client";

import { useState } from "react";
import {
  FileText,
  UserRound,
  Sparkles,
  Loader2,
  Play,
} from "lucide-react";

import { extractPdfText } from "@/lib/extractPdfText";
import AnalysisReport from "@/components/AnalysisReport";

export default function EligibilityPage() {
  const [protocolFile, setProtocolFile] = useState<File | null>(null);
  const [participantFile, setParticipantFile] =
    useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  async function loadDemoCase() {
    try {
      setLoading(true);

      const [protocolResponse, participantResponse] =
        await Promise.all([
          fetch("/demo/protocol-demo.pdf"),
          fetch("/demo/participant-demo.pdf"),
        ]);

      if (!protocolResponse.ok || !participantResponse.ok) {
        throw new Error("Demo files could not be loaded");
      }

      const [protocolBlob, participantBlob] =
        await Promise.all([
          protocolResponse.blob(),
          participantResponse.blob(),
        ]);

      const protocol = new File(
        [protocolBlob],
        "protocol-demo.pdf",
        {
          type: "application/pdf",
        }
      );

      const participant = new File(
        [participantBlob],
        "participant-demo.pdf",
        {
          type: "application/pdf",
        }
      );

      setProtocolFile(protocol);
      setParticipantFile(participant);

      setReport(null);
    } catch (error) {
      console.error("Demo loading failed:", error);
      alert("Unable to load demo case.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!protocolFile || !participantFile) return;

    try {
      setLoading(true);
      setReport(null);

      const protocolText =
        await extractPdfText(protocolFile);

      const participantText =
        await extractPdfText(participantFile);

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

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Analysis failed"
        );
      }

      setReport(data.result);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Analysis failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-7xl px-6 py-12">

        {/* Header */}

        <div className="mb-10">

          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
            <Sparkles size={16} />
            AI Eligibility Intelligence
          </div>

          <h1 className="mt-5 text-4xl font-bold">
            Clinical Trial Eligibility
          </h1>

          <p className="mt-3 max-w-3xl text-slate-500">
            Compare a clinical trial protocol with a
            participant medical summary and identify
            eligibility, missing assessments and clinical
            actions.
          </p>

        </div>

        {/* Demo */}

        <div className="mb-8 flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 p-5">

          <div>
            <h2 className="font-semibold text-blue-900">
              Try the TrialIQ demo
            </h2>

            <p className="mt-1 text-sm text-blue-700">
              Load the sample protocol and participant
              automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDemoCase}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Play size={17} />

            Load Demo Case
          </button>

        </div>

        {/* Upload Cards */}

        <div className="grid gap-6 md:grid-cols-2">

          {/* Protocol */}

          <div className="rounded-3xl border bg-white p-7 shadow-sm">

            <FileText
              size={36}
              className="text-blue-600"
            />

            <h2 className="mt-5 text-xl font-semibold">
              Clinical Trial Protocol
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Upload the study protocol PDF.
            </p>

            <label className="mt-6 block cursor-pointer">

              <div className="rounded-2xl border-2 border-dashed p-10 text-center">

                {protocolFile ? (
                  <>
                    <p className="font-semibold text-green-600">
                      ✓ {protocolFile.name}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {(protocolFile.size / 1024 / 1024).toFixed(
                        2
                      )}{" "}
                      MB
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">
                      Choose protocol PDF
                    </p>

                    <p className="mt-2 text-sm text-slate-400">
                      Click to browse
                    </p>
                  </>
                )}

              </div>

              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  setProtocolFile(
                    e.target.files?.[0] ?? null
                  );
                  setReport(null);
                }}
              />

            </label>

          </div>

          {/* Participant */}

          <div className="rounded-3xl border bg-white p-7 shadow-sm">

            <UserRound
              size={36}
              className="text-blue-600"
            />

            <h2 className="mt-5 text-xl font-semibold">
              Participant Medical Summary
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Upload the participant medical summary.
            </p>

            <label className="mt-6 block cursor-pointer">

              <div className="rounded-2xl border-2 border-dashed p-10 text-center">

                {participantFile ? (
                  <>
                    <p className="font-semibold text-green-600">
                      ✓ {participantFile.name}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {(participantFile.size / 1024 / 1024).toFixed(
                        2
                      )}{" "}
                      MB
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">
                      Choose participant PDF
                    </p>

                    <p className="mt-2 text-sm text-slate-400">
                      Click to browse
                    </p>
                  </>
                )}

              </div>

              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  setParticipantFile(
                    e.target.files?.[0] ?? null
                  );
                  setReport(null);
                }}
              />

            </label>

          </div>

        </div>

        {/* Analyze */}

        <div className="mt-8 flex justify-center">

          <button
            type="button"
            disabled={
              !protocolFile ||
              !participantFile ||
              loading
            }
            onClick={handleAnalyze}
            className="flex items-center gap-3 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Analyzing...
              </>
            ) : (
              "Analyze Eligibility"
            )}
          </button>

        </div>

        {/* Report */}

        {report && (
          <AnalysisReport report={report} />
        )}

      </div>

    </main>
  );
}