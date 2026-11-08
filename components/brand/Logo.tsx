// TrialIQ mark: a criterion row ticked off, with the dot of the "i" as the person who signs it.
// Used in the site nav, the app shell, auth pages and the favicon (app/icon.svg).
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="8" fill="#2F66D0" />
      <path d="M8.5 16.5l4.5 4.5 9-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="23.5" cy="21.5" r="2.4" fill="#9CC0FF" />
    </svg>
  );
}

export function Logo({ size = 24, tone = "dark", className }: { size?: number; tone?: "dark" | "light"; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={size} />
      <span className={`font-bold tracking-[-0.02em] ${tone === "light" ? "text-white" : "text-ink"}`} style={{ fontSize: size * 0.74 }}>
        Trial<span className={tone === "light" ? "text-[#9CC0FF]" : "text-primary"}>IQ</span>
      </span>
    </span>
  );
}
