"use client";

import { useState } from "react";
import {
  ClipboardX,
  UploadCloud,
  Loader2,
  Play,
} from "lucide-react";

import { extractPdfText } from "@/lib/extractPdfText";
import DeviationReport from "@/components/DeviationReport";

export default function DeviationsPage() {
  const [protocolFile, setProtocolFile] =
    useState<File | null>(null);

  const [deviationFile, setDeviationFile] =
    useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  async function loadDemoFiles() {
    try {
      setLoading(true);

      const [
        protocolResponse,
        deviationResponse,
      ] = await Promise.all([
        fetch("/demo/protocol-demo.pdf"),
        fetch("/demo/deviation-demo.pdf"),
      ]);

      if (
        !protocolResponse.ok ||
        !deviationResponse.ok
      ) {
        throw new Error(
          "Demo protocol or deviation document could not be loaded."
        );
      }

      const [
        protocolBlob,
        deviationBlob,
      ] = await Promise.all([
        protocolResponse.blob(),
        deviationResponse.blob(),
      ]);

      setProtocolFile(
        new File(
          [protocolBlob],
          "protocol-demo.pdf",
          {
            type: "application/pdf",
          }
        )
      );

      setDeviationFile(
        new File(
          [deviationBlob],
          "deviation-demo.pdf",
          {
            type: "application/pdf",
          }
        )
      );

      setReport(null);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load demo files."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!protocolFile || !deviationFile) {
      alert(
        "Please provide both the clinical trial protocol and participant record."
      );

      return;
    }

    try {
      setLoading(true);
      setReport(null);

      const [
        protocolText,
        deviationText,
      ] = await Promise.all([
        extractPdfText(protocolFile),
        extractPdfText(deviationFile),
      ]);

      const response = await fetch(
        "/api/deviations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            protocol: protocolText,
            participantRecord: deviationText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Protocol deviation analysis failed."
        );
      }

      setReport(data.result);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Protocol deviation analysis failed."
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

          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
            <ClipboardX size={18} />
            AI Protocol Compliance
          </div>

          <h1 className="mt-5 text-5xl font-bold text-slate-900">
            Protocol Deviation Detection
          </h1>

          <p className="mt-4 max-w-3xl text-slate-500">
            Compare participant records against protocol
            requirements to identify missed visits,
            out-of-window assessments, missing procedures
            and other potential protocol deviations.
          </p>

        </div>

        {/* DEMO */}

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <Play
                size={17}
                className="text-orange-600"
              />

              <h2 className="font-semibold text-orange-900">
                Try the live demo
              </h2>

            </div>

            <p className="mt-1 text-sm text-orange-700">
              Load the sample protocol and participant
              deviation record.
            </p>

          </div>

          <button
            type="button"
            onClick={loadDemoFiles}
            disabled={loading}
            className="flex w-fit items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
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

                Load Demo
              </>
            )}

          </button>

        </div>

        {/* DOCUMENTS */}

        <div className="grid gap-6 md:grid-cols-2">

          <DocumentCard
            title="Clinical Trial Protocol"
            description="The protocol defines what should happen."
            file={protocolFile}
            onChange={(file) => {
              setProtocolFile(file);
              setReport(null);
            }}
          />

          <DocumentCard
            title="Participant Record"
            description="The participant record defines what actually happened."
            file={deviationFile}
            onChange={(file) => {
              setDeviationFile(file);
              setReport(null);
            }}
          />

        </div>

        {/* ANALYZE */}

        <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="font-semibold">
                Protocol comparison
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                TrialIQ will compare protocol requirements
                with documented participant events.
              </p>

            </div>

            <button
              type="button"
              disabled={
                !protocolFile ||
                !deviationFile ||
                loading
              }
              onClick={handleAnalyze}
              className="flex items-center justify-center gap-3 rounded-xl bg-orange-600 px-8 py-4 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Detecting Deviations...
                </>
              ) : (
                "Detect Protocol Deviations"
              )}

            </button>

          </div>

        </div>

        {/* REPORT */}

        {report && (
          <DeviationReport report={report} />
        )}

      </div>

    </main>
  );
}


function DocumentCard({
  title,
  description,
  file,
  onChange,
}: {
  title: string;
  description: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">

      <h2 className="text-lg font-semibold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>

      <label className="mt-5 block cursor-pointer">

        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition hover:border-orange-400 hover:bg-orange-50/30">

          <UploadCloud
            size={42}
            className="text-orange-600"
          />

          {file ? (
            <>
              <p className="mt-4 font-semibold text-green-600">
                ✓ {file.name}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {(file.size / 1024 / 1024).toFixed(
                  2
                )}{" "}
                MB
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Click to replace
              </p>
            </>
          ) : (
            <>
              <p className="mt-4 font-medium">
                Upload PDF
              </p>

              <p className="mt-2 text-sm text-slate-400">
                PDF only
              </p>
            </>
          )}

        </div>

        <input
          hidden
          type="file"
          accept=".pdf,application/pdf"
          onChange={(event) =>
            onChange(
              event.target.files?.[0] ?? null
            )
          }
        />

      </label>

    </div>
  );
}