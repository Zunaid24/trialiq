interface Props {
  report: any;
}

export default function PatientMatchingReport({
  report,
}: Props) {
  if (!report) return null;

  const profile = report.patientProfile ?? {};

  return (
    <div className="mt-10 space-y-8">

      {/* Patient Profile */}

      <div className="rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-600 p-8 text-white shadow-xl">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm text-emerald-100">
              AI Patient Profile
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {profile.diagnosis ?? "Clinical Profile"}
            </h2>
          </div>

          <div className="rounded-full bg-white/10 px-4 py-2 text-sm">
            Confidence: {report.confidence ?? "--"}%
          </div>

        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">

          <Metric
            label="Age"
            value={profile.age}
          />

          <Metric
            label="Gender"
            value={profile.gender}
          />

          <Metric
            label="Disease Stage"
            value={profile.diseaseStage}
          />

          <Metric
            label="ECOG"
            value={profile.ecog}
          />

        </div>

      </div>

      <Section title="Recommended Trial Characteristics">
        <List
          items={
            report.recommendedTrialCharacteristics
          }
        />
      </Section>

      <Section title="Preferred Trial Types">
        <List
          items={
            report.trialProfile?.preferredTrialTypes
          }
        />
      </Section>

      <Section title="Matching Signals">

        <div className="space-y-3">

          {report.matchingSignals?.map(
            (item: any, index: number) => (
              <div
                key={index}
                className="rounded-xl border p-4"
              >

                <h3 className="font-semibold">
                  {item.factor}
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  {item.value}
                </p>

                <p className="mt-2 text-sm text-emerald-700">
                  {item.relevance}
                </p>

              </div>
            )
          )}

        </div>

      </Section>

      <Section title="Clinical Concerns">

        <div className="space-y-3">

          {report.clinicalConcerns?.map(
            (item: any, index: number) => (
              <div
                key={index}
                className="rounded-xl border border-red-200 bg-red-50 p-4"
              >

                <h3 className="font-semibold text-red-900">
                  {item.concern}
                </h3>

                <p className="mt-2 text-sm text-red-800">
                  {item.impact}
                </p>

              </div>
            )
          )}

        </div>

      </Section>

      <Section title="Missing Information">

        <div className="space-y-3">

          {report.missingInformation?.map(
            (item: any, index: number) => (
              <div
                key={index}
                className="rounded-xl border border-yellow-200 bg-yellow-50 p-4"
              >

                <h3 className="font-semibold text-yellow-900">
                  {item.item}
                </h3>

                <p className="mt-2 text-sm text-yellow-800">
                  {item.reason}
                </p>

              </div>
            )
          )}

        </div>

      </Section>

      <Section title="Recommended Next Steps">
        <List items={report.nextSteps} numbered />
      </Section>

    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">

      <p className="text-sm text-emerald-100">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {value || "--"}
      </p>

    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-white p-8 shadow-sm">

      <h2 className="mb-6 text-2xl font-bold">
        {title}
      </h2>

      {children}

    </section>
  );
}

function List({
  items,
  numbered = false,
}: {
  items?: string[];
  numbered?: boolean;
}) {
  if (!items?.length) {
    return (
      <p className="text-slate-500">
        No information available.
      </p>
    );
  }

  return (
    <div className="space-y-3">

      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-xl border bg-slate-50 p-4"
        >
          {numbered && (
            <span className="mr-3 font-semibold text-emerald-600">
              {index + 1}.
            </span>
          )}

          {item}
        </div>
      ))}

    </div>
  );
}