interface Props {
  report: any;
}

export default function ProtocolReport({ report }: Props) {
  if (!report) return null;

  return (
    <div className="mt-10 space-y-8">

      {/* Hero */}

      <div className="rounded-3xl bg-gradient-to-r from-violet-700 to-indigo-700 p-10 text-white">

        <h1 className="text-4xl font-bold">
          {report.studyTitle}
        </h1>

        <p className="mt-3 text-violet-100">
          {report.phase}
        </p>

        <p className="mt-6 max-w-4xl">
          {report.executiveSummary}
        </p>

      </div>

      <Section
        title="Study Information"
        items={[
          `Sponsor: ${report.sponsor}`,
          `Indication: ${report.indication}`,
          `Study Design: ${report.studyDesign}`,
          `Population: ${report.population}`,
          `Objective: ${report.objective}`,
        ]}
      />

      <Section
        title="Inclusion Criteria"
        items={report.inclusionCriteria}
      />

      <Section
        title="Exclusion Criteria"
        items={report.exclusionCriteria}
      />

      <Section
        title="Visit Schedule"
        items={report.visitSchedule}
      />

      <Section
        title="Lab Requirements"
        items={report.labRequirements}
      />

      <Section
        title="Safety Monitoring"
        items={report.safetyMonitoring}
      />

      <Section
        title="Primary Endpoints"
        items={report.primaryEndpoints}
      />

      <Section
        title="Secondary Endpoints"
        items={report.secondaryEndpoints}
      />

      <Section
        title="Coordinator Checklist"
        items={report.coordinatorChecklist}
      />

      <Section
        title="Risk Flags"
        items={report.riskFlags}
      />

    </div>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="rounded-3xl border bg-white p-8 shadow-sm">

      <h2 className="mb-6 text-2xl font-bold">
        {title}
      </h2>

      <div className="space-y-3">

        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border p-4"
          >
            {item}
          </div>
        ))}

      </div>

    </div>
  );
}