"use client";
"use client";

import { useState } from "react";
import { Brain, UploadCloud, Loader2 } from "lucide-react";
import { extractPdfText } from "@/lib/extractPdfText";
import ProtocolReport from "@/components/ProtocolReport";

export default function ProtocolPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  async function handleAnalyze() {
    if (!file) return;

    try {
      setLoading(true);

      const protocolText = await extractPdfText(file);

      const response = await fetch("/api/protocol", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          protocol: protocolText,
        }),
      });

      const data = await response.json();

      setLoading(false);

      if (!data.success) {
        alert(data.message);
        return;
      }

      setReport(data.result);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-7xl p-10">

        <div className="mb-10">

          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700">
            <Brain size={18} />
            AI Protocol Intelligence
          </div>

          <h1 className="mt-5 text-5xl font-bold">
            Protocol Intelligence
          </h1>

          <p className="mt-4 max-w-3xl text-slate-500">
            Upload a clinical trial protocol and let TrialIQ extract
            eligibility rules, visit schedule, endpoints,
            coordinator checklist and risks automatically.
          </p>

        </div>

        <div className="rounded-3xl border bg-white p-10 shadow-sm">

          <label className="cursor-pointer">

            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16">

              <UploadCloud
                size={48}
                className="text-violet-600"
              />

              {file ? (
                <>
                  <h2 className="mt-5 font-semibold text-green-600">
                    {file.name}
                  </h2>

                  <p className="mt-2 text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-5 text-xl font-semibold">
                    Upload Clinical Trial Protocol
                  </h2>

                  <p className="mt-2 text-slate-500">
                    PDF Only
                  </p>
                </>
              )}

            </div>

            <input
              hidden
              type="file"
              accept=".pdf"
              onChange={(e) =>
                setFile(e.target.files?.[0] ?? null)
              }
            />

          </label>

          <button
            disabled={!file || loading}
            onClick={handleAnalyze}
            className="mt-8 rounded-xl bg-violet-600 px-8 py-4 font-semibold text-white transition hover:bg-violet-700 disabled:bg-slate-300"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <Loader2
                  className="animate-spin"
                  size={18}
                />
                Extracting Protocol...
              </span>
            ) : (
              "Analyze Protocol"
            )}
          </button>

        </div>

        {report && (
          <ProtocolReport report={report} />
        )}

      </div>

    </main>
  );
}