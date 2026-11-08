import { Page, PageHeader } from "@/components/ds";
import ChecksList from "@/components/modules/ChecksList";
import { modulesForArea } from "@/lib/modules";

export default function AllChecksPage() {
  return (
    <Page>
      <div className="space-y-8">
        <PageHeader title="All checks" lead="Every TrialIQ check in one place. Each one reads the source documents, drafts a result with evidence, and waits for a person to sign it off." />
        <ChecksList title="Participant" modules={modulesForArea("participant")} />
        <ChecksList title="Study" modules={modulesForArea("study")} />
        <ChecksList title="Data quality" modules={modulesForArea("data")} />
      </div>
    </Page>
  );
}
