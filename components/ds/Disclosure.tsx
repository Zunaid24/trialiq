"use client";

import { useState, type ReactNode } from "react";

const cx = (...p: (string | false | undefined)[]) => p.filter(Boolean).join(" ");

// Detail stays hidden until the person asks for it.
export function Disclosure({ label, openLabel, children, defaultOpen = false }: { label: string; openLabel?: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline">
        <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" className={cx("transition-transform", open && "rotate-90")}><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {open ? openLabel || label : label}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
