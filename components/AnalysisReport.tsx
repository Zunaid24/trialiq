interface Props {
  report: any;
}

export default function AnalysisReport({ report }: Props) {
  if (!report) return null;

  const reviewItems = report.pendingAssessments ?? [];

  return (
    <div className="mt-12 space-y-8">
      <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-8 py-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-blue-700">
                AI-assisted eligibility review
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">
                {report.studyTitle ?? "Clinical Trial"}
              </h2>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                report.eligible
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {report.screeningResult ?? "Screening Complete"}
            </span>
          </div>

          <p className="mt-4 max-w-4xl leading-7 text-slate-600">
            {report.executiveSummary ??
              report.reasonForIneligibility ??
              "Clinical trial screening analysis completed."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px bg-slate-100 md:grid-cols-4">
          <Metric label="Participant" value={report.participantId ?? "--"} />
          <Metric label="Eligibility" value={report.screeningResult ?? "--"} />
          <Metric label="Eligibility score" value={report.eligibilityScore != null ? `${report.eligibilityScore}%` : "--"} />
          <Metric label="AI confidence" value={report.confidence != null ? `${report.confidence}%` : "--"} />
        </div>
      </div>

      <Section title="Review first">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-blue-950">
                {reviewItems.length
                  ? `${reviewItems.length} item${reviewItems.length === 1 ? "" : "s"} require human review`
                  : "No pending assessments returned"}
              </p>
              <p className="mt-1 text-sm leading-6 text-blue-800">
                TrialIQ surfaces evidence and potential issues; the clinical team remains responsible for the final decision.
              </p>
            </div>
            <span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
              Human review required
            </span>
          </div>
        </div>
      </Section>

      {report.reasonForIneligibility && (
        <Section title="Primary finding">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <h3 className="font-semibold text-red-900">Potential exclusion identified</h3>
            <p className="mt-2 leading-7 text-red-800">{report.reasonForIneligibility}</p>
          </div>
        </Section>
      )}

      {report.executiveSummary && !report.reasonForIneligibility && (
        <Section title="Clinical finding">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="leading-7 text-blue-900">{report.executiveSummary}</p>
          </div>
        </Section>
      )}

      <Section title="Eligibility criteria review">
        <div className="space-y-6">
          <CriteriaGroup title="Inclusion criteria" items={report.criteriaEvaluation?.inclusion} />
          <CriteriaGroup title="Exclusion criteria" items={report.criteriaEvaluation?.exclusion} />
        </div>
      </Section>

      <Section title="Clinical review actions">
        <div className="space-y-4">
          {reviewItems.length ? (
            reviewItems.map((item: any, index: number) => (
              <div key={index} className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.assessment}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.clinicalImpact}</p>
                  </div>
                  <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No pending assessments available.</p>
          )}
        </div>
      </Section>

      <Section title="Coordinator recommendations">
        {report.recommendations?.length ? (
          <div className="space-y-3">
            {report.recommendations.map((recommendation: string, index: number) => (
              <div key={index} className="rounded-xl border bg-slate-50 p-4">
                <div className="flex gap-3">
                  <span className="font-semibold text-blue-700">{index + 1}.</span>
                  <p className="leading-6 text-slate-700">{recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No recommendations available.</p>
        )}
      </Section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function CriteriaGroup({ title, items }: { title: string; items?: any[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="space-y-3">
        {items?.length ? items.map((item: any, index: number) => <Criterion key={index} item={item} />) : <p className="text-sm text-slate-500">No criteria available.</p>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-5 text-2xl font-bold text-slate-950">{title}</h2>
      {children}
    </section>
  );
}

function Criterion({ item }: { item: any }) {
  const status = item.status ?? "Unknown";
  const normalized = status.toLowerCase();
  const badge = normalized.includes("pending")
    ? "bg-amber-100 text-amber-700"
    : normalized.includes("not met") || normalized === "not"
      ? "bg-red-100 text-red-700"
      : normalized.includes("met")
        ? "bg-green-100 text-green-700"
        : "bg-slate-100 text-slate-700";

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{item.criterion}</p>
          <div className="mt-2 space-y-1 text-sm text-slate-500">
            {item.expected && <p><span className="font-medium text-slate-600">Protocol requires:</span> {item.expected}</p>}
            {item.actual && <p><span className="font-medium text-slate-600">Participant record:</span> {item.actual}</p>}
          </div>
        </div>
        <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-sm font-medium ${badge}`}>{status}</span>
      </div>
    </div>
  );
}