"use client";

import { useState } from "react";
import {
  Brain,
  UploadCloud,
  Loader2,
  Play,
} from "lucide-react";

import { extractPdfText } from "@/lib/extractPdfText";
import ProtocolReport from "@/components/ProtocolReport";

export default function ProtocolPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  async function loadDemoProtocol() {
    try {
      setLoading(true);

      const response = await fetch(
        "/demo/protocol-demo.pdf"
      );

      if (!response.ok) {
        throw new Error(
          "Demo protocol could not be loaded."
        );
      }

      const blob = await response.blob();

      const demoFile = new File(
        [blob],
        "protocol-demo.pdf",
        {
          type: "application/pdf",
        }
      );

      setFile(demoFile);
      setReport(null);
    } catch (error) {
      console.error(error);

      alert(
        "Unable to load the demo protocol."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!file) return;

    try {
      setLoading(true);
      setReport(null);

      const protocolText =
        await extractPdfText(file);

      const response = await fetch(
        "/api/protocol",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            protocol: protocolText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message ||
            "Protocol analysis failed."
        );
        return;
      }

      setReport(data.result);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Protocol analysis failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-7xl p-10">

        {/* HEADER */}

        <div className="mb-8">

          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700">

            <Brain size={18} />

            AI Protocol Intelligence

          </div>

          <h1 className="mt-5 text-5xl font-bold">
            Protocol Intelligence
          </h1>

          <p className="mt-4 max-w-3xl text-slate-500">
            Upload a clinical trial protocol and let
            TrialIQ extract eligibility rules, visit
            schedule, endpoints, coordinator checklist
            and risks automatically.
          </p>

        </div>


        {/* DEMO BANNER */}

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-violet-200 bg-violet-50 p-5 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <Play
                size={17}
                className="text-violet-600"
              />

              <h2 className="font-semibold text-violet-900">
                Try the live demo
              </h2>

            </div>

            <p className="mt-1 text-sm text-violet-700">
              Load our sample clinical trial protocol
              and analyze it instantly.
            </p>

          </div>

          <button
            type="button"
            onClick={loadDemoProtocol}
            disabled={loading}
            className="flex w-fit items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />

                Loading Demo...
              </>
            ) : (
              <>
                <Play size={17} />

                Load Demo Protocol
              </>
            )}

          </button>

        </div>


        {/* UPLOAD CARD */}

        <div className="rounded-3xl border bg-white p-10 shadow-sm">

          <label className="cursor-pointer">

            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 transition hover:border-violet-400 hover:bg-violet-50/30">

              <UploadCloud
                size={48}
                className="text-violet-600"
              />

              {file ? (
                <>

                  <h2 className="mt-5 font-semibold text-green-600">
                    ✓ {file.name}
                  </h2>

                  <p className="mt-2 text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(
                      2
                    )}{" "}
                    MB
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    Click to replace document
                  </p>

                </>
              ) : (
                <>

                  <h2 className="mt-5 text-xl font-semibold">
                    Upload Clinical Trial Protocol
                  </h2>

                  <p className="mt-2 text-slate-500">
                    PDF only
                  </p>

                </>
              )}

            </div>

            <input
              hidden
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                setFile(
                  e.target.files?.[0] ?? null
                );

                setReport(null);
              }}
            />

          </label>


          {/* ANALYZE BUTTON */}

          <button
            type="button"
            disabled={!file || loading}
            onClick={handleAnalyze}
            className="mt-8 flex items-center gap-3 rounded-xl bg-violet-600 px-8 py-4 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >

            {loading ? (
              <>
                <Loader2
                  className="animate-spin"
                  size={18}
                />

                Analyzing Protocol...
              </>
            ) : (
              "Analyze Protocol"
            )}

          </button>

        </div>


        {/* AI REPORT */}

        {report && (
          <ProtocolReport report={report} />
        )}

      </div>

    </main>
  );
}