// TrialIQ mark: a circle split in two. One half is the protocol, the other is the participant record;
// TrialIQ reads them together. Used in the site nav, the app shell, auth pages, footer and favicon (app/icon.svg).
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="8" fill="#2F66D0" />
      <path d="M15 7.5a8.5 8.5 0 0 0 0 17z" fill="#9CC0FF" />
      <path d="M17 7.5a8.5 8.5 0 0 1 0 17z" fill="#fff" />
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
