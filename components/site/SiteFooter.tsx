import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-3 px-5 py-8 text-[13px] text-ink-2 md:flex-row md:items-center md:justify-between md:px-8">
        <p><span className="font-semibold text-ink">TrialIQ</span>. A product design project by Zunaid Ahmed. Synthetic demo data only, not for clinical use.</p>
        <div className="flex gap-5"><Link href="/#how" className="hover:text-ink">How it works</Link><Link href="/auth" className="hover:text-ink">Sign in</Link></div>
      </div>
    </footer>
  );
}
