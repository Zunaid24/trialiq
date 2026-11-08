import { List, Row, SectionTitle } from "@/components/ds";
import { MODULES, type ModuleDef } from "@/lib/modules";

export const hrefFor = (m: ModuleDef) => (m.id === "eligibility" ? "/dashboard/participants/PT-1042" : `/dashboard/workspace/${m.id}`);

export default function ChecksList({ title, modules }: { title?: string; modules: ModuleDef[] }) {
  return (
    <section>
      {title && <SectionTitle title={title} count={modules.length} />}
      <List>
        {modules.map((m) => (
          <Row key={m.id} href={hrefFor(m)} title={m.title} detail={m.job} aside={`Signed off by ${m.signOff}`}
            status={<span className="text-sm font-semibold text-primary" aria-hidden>Open</span>} />
        ))}
      </List>
    </section>
  );
}

export const ALL = MODULES;
