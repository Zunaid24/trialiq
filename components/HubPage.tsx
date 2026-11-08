import { Page, PageHeader } from "@/components/ds";
import ChecksList from "@/components/modules/ChecksList";
import { modulesForArea, type ModuleDef } from "@/lib/modules";

export default function HubPage({ title, lead, area }: { title: string; lead: string; area: ModuleDef["area"] }) {
  return (
    <Page>
      <div className="space-y-6">
        <PageHeader title={title} lead={lead} />
        <ChecksList modules={modulesForArea(area)} />
      </div>
    </Page>
  );
}
