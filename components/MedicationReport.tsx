interface Props {
  report: any;
}

export default function MedicationReport({
  report,
}: Props) {
  if (!report) return null;

  const medications = Array.isArray(
    report.medications
  )
    ? report.medications
    : [];

  const concerns = Array.isArray(
    report.potentialProtocolConcerns
  )
    ? report.potentialProtocolConcerns
    : [];

  const dateIssues = Array.isArray(
    report.dateIssues
  )
    ? report.dateIssues
    : [];

  const missingInformation = Array.isArray(
    report.missingInformation
  )
    ? report.missingInformation
    : [];

  const coordinatorActions = Array.isArray(
    report.coordinatorActions
  )
    ? report.coordinatorActions
    : [];

  const protocolReviewRequired = Array.isArray(
    report.protocolReviewRequired
  )
    ? report.protocolReviewRequired
    : [];

  return (
    <div className="mt-10 space-y-8">

      {/* SUMMARY */}

      <div className="rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-600 p-8 text-white shadow-xl">

        <p className="text-sm text-emerald-100">
          AI Medication Review
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {report.patientId
            ? `Participant ${report.patientId}`
            : "Medication Review"}
        </h2>

        <p className="mt-4 max-w-4xl leading-7 text-emerald-100">
          {report.summary ||
            "Medication review completed."}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <Metric
            label="Medications"
            value={medications.length}
          />

          <Metric
            label="Potential Concerns"
            value={concerns.length}
          />

          <Metric
            label="Confidence"
            value={
              report.confidence != null
                ? `${report.confidence}%`
                : "--"
            }
          />

        </div>

      </div>


      {/* MEDICATIONS */}

      <Section title="Medications">

        {medications.length > 0 ? (
          <div className="overflow-x-auto">

            <table className="w-full border-collapse">

              <thead>

                <tr className="border-b text-left text-sm text-slate-500">

                  <th className="p-3">
                    Medication
                  </th>

                  <th className="p-3">
                    Dose
                  </th>

                  <th className="p-3">
                    Frequency
                  </th>

                  <th className="p-3">
                    Route
                  </th>

                  <th className="p-3">
                    Indication
                  </th>

                  <th className="p-3">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {medications.map(
                  (
                    medication: any,
                    index: number
                  ) => (
                    <tr
                      key={index}
                      className="border-b last:border-0"
                    >

                      <td className="p-3 font-semibold text-slate-900">
                        {medication.name || "-"}
                      </td>

                      <td className="p-3 text-sm text-slate-600">
                        {medication.dose || "-"}
                      </td>

                      <td className="p-3 text-sm text-slate-600">
                        {medication.frequency || "-"}
                      </td>

                      <td className="p-3 text-sm text-slate-600">
                        {medication.route || "-"}
                      </td>

                      <td className="p-3 text-sm text-slate-600">
                        {medication.indication || "-"}
                      </td>

                      <td className="p-3 text-sm text-slate-600">
                        {medication.status || "-"}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        ) : (
          <Empty text="No medications identified." />
        )}

      </Section>


      {/* PROTOCOL CONCERNS */}

      <Section title="Potential Protocol Concerns">

        {concerns.length > 0 ? (
          <div className="space-y-4">

            {concerns.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5"
                >

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <h3 className="font-semibold text-yellow-900">
                      {item.medication ||
                        "Medication"}
                    </h3>

                    <span className="w-fit rounded-full bg-yellow-200 px-3 py-1 text-xs font-semibold text-yellow-800">
                      {item.priority || "Review"}
                    </span>

                  </div>

                  <p className="mt-3 text-sm font-medium text-yellow-900">
                    {item.concern ||
                      "Potential protocol concern identified."}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {item.reason ||
                      "Additional protocol review may be required."}
                  </p>

                </div>
              )
            )}

          </div>
        ) : (
          <Empty text="No potential protocol concerns identified." />
        )}

      </Section>


      {/* DATE ISSUES */}

      <Section title="Medication Date Issues">

        {dateIssues.length > 0 ? (
          <div className="space-y-3">

            {dateIssues.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border bg-slate-50 p-4"
                >

                  <h3 className="font-semibold">
                    {item.medication ||
                      "Medication"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-700">
                    {item.issue || ""}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {item.details || ""}
                  </p>

                </div>
              )
            )}

          </div>
        ) : (
          <Empty text="No medication date issues identified." />
        )}

      </Section>


      {/* MISSING INFORMATION */}

      <Section title="Missing Information">

        {missingInformation.length > 0 ? (
          <div className="space-y-3">

            {missingInformation.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border border-orange-200 bg-orange-50 p-4"
                >

                  <h3 className="font-semibold text-orange-900">
                    {item.medication ||
                      "Medication"}
                  </h3>

                  <p className="mt-1 text-sm text-orange-800">
                    Missing:{" "}
                    {item.missing || "-"}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {item.reason || ""}
                  </p>

                </div>
              )
            )}

          </div>
        ) : (
          <Empty text="No missing medication information identified." />
        )}

      </Section>


      {/* PROTOCOL REVIEW */}

      <Section title="Protocol Review Required">

        <List
          items={protocolReviewRequired}
        />

      </Section>


      {/* COORDINATOR ACTIONS */}

      <Section title="Coordinator Actions">

        <List
          items={coordinatorActions}
          numbered
        />

      </Section>


      {/* DISCLAIMER */}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">

        This assessment is intended to support clinical
        research workflow and coordinator review. Potential
        protocol concerns should be verified against the
        applicable study protocol and reviewed by the
        appropriate clinical or study team.

      </div>

    </div>
  );
}


function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">

      <p className="text-sm text-emerald-100">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
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

      <h2 className="mb-6 text-2xl font-bold text-slate-900">
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
  items: string[];
  numbered?: boolean;
}) {
  if (!items.length) {
    return (
      <Empty text="No items identified." />
    );
  }

  return (
    <div className="space-y-3">

      {items.map(
        (item: string, index: number) => (
          <div
            key={index}
            className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700"
          >

            {numbered && (
              <span className="mr-3 font-semibold text-emerald-600">
                {index + 1}.
              </span>
            )}

            {item}

          </div>
        )
      )}

    </div>
  );
}


function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <p className="text-sm text-slate-500">
      {text}
    </p>
  );
}