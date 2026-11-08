import HubPage from "@/components/HubPage";

export default function DataQualityPage() {
  return <HubPage title="Data quality" intro="Records that disagree, and terms that still need coding, before the monitor finds them." entries={[
    { title: "Reconciliation", text: "Compares labs, meds, adverse events and deviations for conflicting dates and missing fields.", href: "/dashboard/workspace/reconciliation" },
    { title: "Medical coding", text: "Suggests MedDRA terms for verbatim entries. A coder confirms each one.", href: "/dashboard/workspace/medical-coding" },
  ]} />;
}
