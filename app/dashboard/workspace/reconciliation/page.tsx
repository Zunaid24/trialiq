"use client";

import { useState } from "react";
import {
  GitCompareArrows,
  UploadCloud,
  Loader2,
  Play,
} from "lucide-react";

import { extractPdfText } from "@/lib/extractPdfText";
import ReconciliationReport from "@/components/ReconciliationReport";

type Documents = {
  labs: File | null;
  medications: File | null;
  adverseEvent: File | null;
  deviation: File | null;
};

export default function ReconciliationPage() {
  const [documents, setDocuments] = useState<Documents>({
    labs: null,
    medications: null,
    adverseEvent: null,
    deviation: null,
  });

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  async function loadDemoDocuments() {
    try {
      setLoading(true);

      const [
        labsResponse,
        medicationResponse,
        adverseEventResponse,
        deviationResponse,
      ] = await Promise.all([
        fetch("/demo/lab-demo.pdf"),
        fetch("/demo/medication-demo.pdf"),
        fetch("/demo/adverse-event-demo.pdf"),
        fetch("/demo/deviation-demo.pdf"),
      ]);

      if (
        !labsResponse.ok ||
        !medicationResponse.ok ||
        !adverseEventResponse.ok ||
        !deviationResponse.ok
      ) {
        throw new Error(
          "One or more demo documents could not be loaded."
        );
      }

      const [
        labsBlob,
        medicationBlob,
        adverseEventBlob,
        deviationBlob,
      ] = await Promise.all([
        labsResponse.blob(),
        medicationResponse.blob(),
        adverseEventResponse.blob(),
        deviationResponse.blob(),
      ]);

      setDocuments({
        labs: new File(
          [labsBlob],
          "lab-demo.pdf",
          { type: "application/pdf" }
        ),

        medications: new File(
          [medicationBlob],
          "medication-demo.pdf",
          { type: "application/pdf" }
        ),

        adverseEvent: new File(
          [adverseEventBlob],
          "adverse-event-demo.pdf",
          { type: "application/pdf" }
        ),

        deviation: new File(
          [deviationBlob],
          "deviation-demo.pdf",
          { type: "application/pdf" }
        ),
      });

      setReport(null);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load demo documents."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    const {
      labs,
      medications,
      adverseEvent,
      deviation,
    } = documents;

    if (
      !labs &&
      !medications &&
      !adverseEvent &&
      !deviation
    ) {
      alert(
        "Please upload at least one clinical document."
      );

      return;
    }

    try {
      setLoading(true);
      setReport(null);

      const documentEntries: Record<
        string,
        string
      > = {};

      if (labs) {
        documentEntries.laboratory =
          await extractPdfText(labs);
      }

      if (medications) {
        documentEntries.medications =
          await extractPdfText(medications);
      }

      if (adverseEvent) {
        documentEntries.adverseEvent =
          await extractPdfText(adverseEvent);
      }

      if (deviation) {
        documentEntries.deviation =
          await extractPdfText(deviation);
      }

      const response = await fetch(
        "/api/reconciliation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documents: documentEntries,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Clinical reconciliation failed."
        );
      }

      setReport(data.result);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Clinical reconciliation failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateDocument(
    key: keyof Documents,
    file: File | null
  ) {
    setDocuments((current) => ({
      ...current,
      [key]: file,
    }));

    setReport(null);
  }

  return (
    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-7xl p-10">

        <div className="mb-8">

          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
            <GitCompareArrows size={18} />
            AI Clinical Data Reconciliation
          </div>

          <h1 className="mt-5 text-5xl font-bold">
            Clinical Data Reconciliation
          </h1>

          <p className="mt-4 max-w-3xl text-slate-500">
            Compare information across clinical records
            and identify discrepancies, conflicting dates,
            missing information and coordinator follow-up
            requirements.
          </p>

        </div>

        {/* DEMO */}

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="font-semibold text-indigo-900">
              Try the live demo
            </h2>

            <p className="mt-1 text-sm text-indigo-700">
              Load four related synthetic participant
              documents automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDemoDocuments}
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : "Load Demo Documents"}
          </button>

        </div>

        {/* DOCUMENTS */}

        <div className="grid gap-6 md:grid-cols-2">

          <DocumentCard
            title="Laboratory Report"
            file={documents.labs}
            onChange={(file) =>
              updateDocument("labs", file)
            }
          />

          <DocumentCard
            title="Medication Record"
            file={documents.medications}
            onChange={(file) =>
              updateDocument(
                "medications",
                file
              )
            }
          />

          <DocumentCard
            title="Adverse Event Record"
            file={documents.adverseEvent}
            onChange={(file) =>
              updateDocument(
                "adverseEvent",
                file
              )
            }
          />

          <DocumentCard
            title="Protocol Deviation Record"
            file={documents.deviation}
            onChange={(file) =>
              updateDocument(
                "deviation",
                file
              )
            }
          />

        </div>

        {/* ANALYZE */}

        <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="font-semibold">
                Cross-document analysis
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                TrialIQ will compare the available
                records and identify inconsistencies.
              </p>

            </div>

            <button
              type="button"
              disabled={
                loading ||
                !Object.values(documents).some(Boolean)
              }
              onClick={handleAnalyze}
              className="flex items-center justify-center gap-3 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Reconciling Data...
                </>
              ) : (
                "Reconcile Clinical Data"
              )}

            </button>

          </div>

        </div>

        {report && (
          <ReconciliationReport
            report={report}
          />
        )}

      </div>

    </main>
  );
}

function DocumentCard({
  title,
  file,
  onChange,
}: {
  title: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">

      <h2 className="mb-4 text-lg font-semibold">
        {title}
      </h2>

      <label className="block cursor-pointer">

        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center hover:border-indigo-400">

          <UploadCloud
            size={40}
            className="text-indigo-600"
          />

          {file ? (
            <>
              <p className="mt-4 font-semibold text-green-600">
                ✓ {file.name}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(
                  2
                )}{" "}
                MB
              </p>
            </>
          ) : (
            <>
              <p className="mt-4 font-medium">
                Upload PDF
              </p>

              <p className="mt-1 text-xs text-slate-400">
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