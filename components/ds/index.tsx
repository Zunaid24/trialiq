// TrialIQ design system v3 (Figma: "TrialIQ / 06 Design system v3").
// Every page in the app is built from these pieces, so the product looks and behaves the same everywhere.
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
export { Disclosure } from "./Disclosure";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Buttons ---------- */
type Kind = "primary" | "secondary" | "danger" | "ghost";
const kinds: Record<Kind, string> = {
  primary: "bg-primary text-white hover:bg-brand-700 active:bg-brand-800 disabled:bg-primary/40",
  secondary: "border border-line-strong bg-white text-ink hover:bg-page disabled:text-ink-3",
  danger: "border border-[#F0C5BD] bg-white text-no hover:bg-no-bg",
  ghost: "text-primary hover:text-brand-800 hover:underline underline-offset-4",
};
const sizes = { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4 text-sm", lg: "h-12 px-5 text-[15px]" };
type Size = keyof typeof sizes;
function btnClass(kind: Kind, size: Size, extra?: string) {
  return cx(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
    kind !== "ghost" && sizes[size],
    kind === "ghost" && "text-sm",
    kinds[kind],
    extra
  );
}
export function Button({ kind = "secondary", size = "md", className, ...rest }: ComponentProps<"button"> & { kind?: Kind; size?: Size }) {
  return <button {...rest} className={btnClass(kind, size, className)} />;
}
export function ButtonLink({ kind = "secondary", size = "md", className, ...rest }: ComponentProps<typeof Link> & { kind?: Kind; size?: Size }) {
  return <Link {...rest} className={btnClass(kind, size, className)} />;
}

/* ---------- Surfaces ---------- */
export function Card({ className, as: As = "section", ...rest }: Omit<ComponentProps<"section">, "ref"> & { as?: "section" | "div" | "article" | "aside" }) {
  return <As {...rest} className={cx("rounded-xl border border-line bg-white", className)} />;
}

export function Page({ children, width = "wide" }: { children: ReactNode; width?: "wide" | "narrow" }) {
  return <div className={cx("mx-auto px-6 py-8 md:px-8", width === "wide" ? "max-w-[1200px]" : "max-w-[880px]")}>{children}</div>;
}

export function PageHeader({ meta, title, lead, actions, children }: { meta?: ReactNode; title: ReactNode; lead?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {meta && <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-3">{meta}</div>}
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.015em] text-ink md:text-[28px]">{title}</h1>
          {lead && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-2">{lead}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {children && <div className="mt-5 border-t border-line pt-4">{children}</div>}
    </Card>
  );
}

export function SectionTitle({ title, count, action }: { title: ReactNode; count?: number | string; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <h2 className="text-[15px] font-semibold text-ink">
        {title}
        {count !== undefined && <span className="ml-2 text-[13px] font-medium text-ink-3">{count}</span>}
      </h2>
      {action}
    </div>
  );
}

/* ---------- Status ---------- */
export type Tone = "no" | "rev" | "ok" | "neutral" | "info";
const tones: Record<Tone, string> = {
  no: "bg-no-bg text-no",
  rev: "bg-rev-bg text-rev",
  ok: "bg-ok-bg text-ok",
  neutral: "bg-page text-ink-2",
  info: "bg-tint text-brand-800",
};
const dots: Record<Tone, string> = { no: "bg-no", rev: "bg-rev", ok: "bg-ok", neutral: "bg-ink-3", info: "bg-primary" };

export function StatusPill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      <span className={cx("h-1.5 w-1.5 rounded-full", dots[tone])} aria-hidden />
      {children}
    </span>
  );
}
export function Dot({ tone }: { tone: Tone }) {
  return <span className={cx("inline-block h-2 w-2 shrink-0 rounded-full", dots[tone])} aria-hidden />;
}

// Maps the many status words the AI and database use onto the three product meanings.
export function toneFor(value: unknown): Tone {
  const v = String(value ?? "").toLowerCase();
  if (!v) return "neutral";
  if (/(not met|fail|critical|abnormal|high|confirmed deviation|serious|major|ineligible|not eligible|violation|conflict|discrepan|prohibited|severe)/.test(v)) return "no";
  if (/(pending|review|potential|unknown|insufficient|missing|not documented|moderate|minor|medium|possible|unclear|partial|requires|query|open)/.test(v)) return "rev";
  if (/(met|normal|eligible|within|resolved|confirmed|low|consistent|complete|match|ok|yes|done|closed)/.test(v)) return "ok";
  return "neutral";
}

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ items, value, onChange, label }: { items: { id: T; label: string; count?: number | string }[]; value: T; onChange: (id: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar flex gap-7 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_var(--line)]">
      {items.map((t) => {
        const on = t.id === value;
        return (
          <button key={t.id} role="tab" aria-selected={on} onClick={() => onChange(t.id)}
            className={cx("flex shrink-0 items-center gap-1.5 border-b-2 pb-3 pt-1 text-sm transition-colors", on ? "border-primary font-semibold text-brand-800" : "border-transparent font-medium text-ink-2 hover:text-ink")}>
            {t.label}
            {t.count !== undefined && t.count !== "" && <span className={cx("text-xs font-medium", on ? "text-primary" : "text-ink-3")}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Lists ---------- */
export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <Card as="div" className={cx("divide-y divide-line overflow-hidden", className)}>{children}</Card>;
}

export function Row({ id, title, detail, aside, status, selected, href, onClick }: { id?: ReactNode; title: ReactNode; detail?: ReactNode; aside?: ReactNode; status?: ReactNode; selected?: boolean; href?: string; onClick?: () => void }) {
  const inner = (
    <>
      {id && <span className={cx("min-w-7 shrink-0 font-mono text-xs", selected ? "text-brand-800" : "text-ink-3")}>{id}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        {detail && <span className="mt-0.5 block text-[13px] leading-5 text-ink-2">{detail}</span>}
      </span>
      {aside && <span className="hidden shrink-0 text-xs text-ink-3 sm:block">{aside}</span>}
      {status}
    </>
  );
  const cls = cx("flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors", selected ? "bg-tint shadow-[inset_3px_0_0_var(--primary)]" : "bg-white hover:bg-page");
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} aria-pressed={selected} className={cls}>{inner}</button>;
  return <div className={cls}>{inner}</div>;
}

/* ---------- Progressive disclosure ---------- */
// Segmented filter: shows one group at a time, each with its count and tone.
export function Segmented<T extends string>({ items, value, onChange, label }: { items: { id: T; label: string; count: number; tone: Tone }[]; value: T; onChange: (id: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-white p-1">
      {items.map((t) => {
        const on = t.id === value;
        return (
          <button key={t.id} role="tab" aria-selected={on} onClick={() => onChange(t.id)} disabled={!t.count}
            className={cx("flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors disabled:opacity-40", on ? "bg-tint font-semibold text-brand-800" : "font-medium text-ink-2 hover:bg-page hover:text-ink")}>
            <Dot tone={t.tone} />{t.label}<span className={on ? "text-primary" : "text-ink-3"}>{t.count}</span>
          </button>
        );
      })}
    </div>
  );
}
/* ---------- AI ---------- */
// The only way AI shows up: one plain status line, and boxes labelled with what TrialIQ did.
export function AiStatus({ children, tone = "ok", action }: { children: ReactNode; tone?: Tone; action?: ReactNode }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-2">
      <Dot tone={tone} />
      <span>{children}</span>
      {action}
    </p>
  );
}
export function AiBox({ label = "TrialIQ suggests", children }: { label?: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-page p-4">
      <p className="text-xs font-semibold text-ink-2">{label}</p>
      <div className="mt-1.5 text-[13px] leading-6 text-ink">{children}</div>
    </div>
  );
}

/* ---------- Data ---------- */
export function KeyValues({ items }: { items: { k: string; v: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.k} className="min-w-0">
          <dt className="text-xs font-medium text-ink-3">{i.k}</dt>
          <dd className="mt-0.5 text-sm text-ink">{i.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="no-scrollbar overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
        <thead className="bg-page">
          <tr>{head.map((h) => <th key={h} scope="col" className="px-3 py-2 text-xs font-semibold text-ink-2">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line align-top">
              {r.map((c, j) => <td key={j} className="px-3 py-2.5 text-ink">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Forms ---------- */
export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}
const inputCls = "w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-ring/40";
export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={cx(inputCls, "h-10", props.className)} />;
}
export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={cx(inputCls, "py-2.5 leading-6", props.className)} />;
}

/* ---------- States ---------- */
export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-2" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary" aria-hidden />
      {label}
    </span>
  );
}
export function Loading({ label = "Loading" }: { label?: string }) {
  return <div className="flex min-h-[40vh] items-center justify-center"><Spinner label={label} /></div>;
}
export function Empty({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <Card as="div" className="border-dashed px-6 py-10 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-md text-[13px] leading-6 text-ink-2">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </Card>
  );
}
export function Notice({ tone = "no", children }: { tone?: Tone; children: ReactNode }) {
  return <div role={tone === "no" ? "alert" : "status"} className={cx("rounded-lg px-4 py-3 text-[13px] leading-6", tones[tone])}>{children}</div>;
}

export function ago(v: string | number | Date) {
  const m = Math.round((Date.now() - new Date(v).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(v).toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}
