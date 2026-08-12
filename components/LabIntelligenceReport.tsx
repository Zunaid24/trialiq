import { AlertTriangle, CheckCircle2, FileSearch, Info, ShieldCheck } from "lucide-react";

interface Props {
  report: any;
}

export default function LabIntelligenceReport({ report }: Props) {
  if (!report) return null;

  const reviewRequired = report.labs?.filter((lab: any) => lab.reviewRequired).length ?? 0;
  const confidence = report.confidence != null ? `${report.confidence}%` : "--";
  const readiness = report.screeningReadiness || "Review Required";
  const readinessNeedsReview = /review|pending/i.test(readiness);

  return (
    <div className="mt-8 space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-br from-blue-700 to-blue-600 px-6 py-7 text-white md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-100">
                <ShieldCheck size={16} />
                AI Laboratory Intelligence
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Laboratory Assessment</h2>
              <p className="mt-3 leading-7 text-blue-50">{report.summary || "Laboratory review completed."}</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Review output
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Patient" value={report.patientId} />
            <Metric label="Total Labs" value={report.labs?.length ?? 0} />
            <Metric label="Review Items" value={reviewRequired} />
            <Metric label="Confidence" value={confidence} />
          </div>
        </div>
        <div className="grid gap-4 border-b border-slate-200 bg-slate-50/80 p-5 md:grid-cols-[1fr_auto] md:items-center md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Screening readiness</p>
            <div className="mt-2 flex items-center gap-2">
              {readinessNeedsReview ? <AlertTriangle size={18} className="text-amber-600" /> : <CheckCircle2 size={18} className="text-emerald-600" />}
              <p className="font-semibold text-slate-900">{readiness}</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Evidence quality:</span>{" "}{report.evidenceQuality || "Not documented"}
          </div>
        </div>
      </section>

      <Section title="Laboratory Results" icon={<FileSearch size={18} />}>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3.5">Test</th>
                <th className="px-4 py-3.5">Value</th>
                <th className="px-4 py-3.5">Reference</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Clinical Significance</th>
              </tr>
            </thead>
            <tbody>
              {report.labs?.map((lab: any, index: number) => <LabRow key={index} lab={lab} />)}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Critical Values">
          {report.criticalValues?.length ? <List items={report.criticalValues} tone="critical" /> : <Empty text="No critical laboratory values identified." />}
        </Section>
        <Section title="Protocol-Relevant Concerns">
          {report.protocolViolations?.length ? <List items={report.protocolViolations} tone="warning" /> : <Empty text="No protocol violations identified from the available laboratory information." />}
        </Section>
      </div>

      <Section title="Missing Laboratory Information">
        {report.missingLabs?.length ? <List items={report.missingLabs} tone="warning" /> : <Empty text="No missing laboratory information identified." />}
      </Section>

      <Section title="Follow-up Actions">
        <List items={report.followUpActions} numbered tone="action" />
      </Section>

      <Section title="Evidence & Review Notes" icon={<Info size={18} />}>
        <div className="grid gap-4 md:grid-cols-2">
          <EvidenceCard label="Confidence rationale" value={report.confidenceRationale || "Not documented."} />
          <EvidenceCard label="Source evidence" value={report.labs?.length ? `${report.labs.length} laboratory observations were extracted from the source document and evaluated against the available reference ranges.` : "No laboratory observations were returned."} />
        </div>
        {report.limitations?.length ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Limitations</p>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {report.limitations.map((item: string, index: number) => <p key={index}>• {item}</p>)}
            </div>
          </div>
        ) : null}
      </Section>
    </div>
  );
}

function LabRow({ lab }: { lab: any }) {
  const status = String(lab.status || "").toLowerCase();
  let badge = "bg-slate-100 text-slate-700";
  if (status.includes("normal")) badge = "bg-emerald-50 text-emerald-700";
  if (status.includes("abnormal")) badge = "bg-amber-50 text-amber-700";
  if (status.includes("critical")) badge = "bg-red-50 text-red-700";
  if (status.includes("missing")) badge = "bg-yellow-50 text-yellow-700";

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
      <td className="px-4 py-4 font-medium text-slate-900">{lab.test || "--"}</td>
      <td className="px-4 py-4 font-medium text-slate-800">{lab.value || "--"} {lab.unit || ""}</td>
      <td className="px-4 py-4 text-sm text-slate-500">{lab.referenceRange || "--"}</td>
      <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>{lab.status || "Unknown"}</span></td>
      <td className="max-w-sm px-4 py-4 text-sm leading-6 text-slate-600">{lab.clinicalSignificance || "--"}</td>
    </tr>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-xs font-medium text-blue-100">{label}</p>
      <p className="mt-1.5 truncate text-xl font-semibold text-white">{value ?? "--"}</p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <div className="mb-5 flex items-center gap-2">
        {icon && <span className="text-blue-600">{icon}</span>}
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function List({ items, numbered = false, tone = "neutral" }: { items?: string[]; numbered?: boolean; tone?: "neutral" | "critical" | "warning" | "action" }) {
  if (!items?.length) return <Empty />;
  const marker = tone === "critical" ? "bg-red-50 text-red-700" : tone === "warning" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700";
  return (
    <div className="space-y-2.5">
      {items.map((item: string, index: number) => (
        <div key={index} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <span className={`flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-semibold ${marker}`}>{numbered ? index + 1 : "•"}</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function EvidenceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function Empty({ text = "No information available." }: { text?: string }) {
  return <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">{text}</p>;
}
