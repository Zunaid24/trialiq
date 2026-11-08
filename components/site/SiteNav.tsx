"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ButtonLink } from "@/components/ds";

export default function SiteNav() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user && !data.user.is_anonymous)));
  }, []);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1160px] items-center gap-6 px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="TrialIQ home"><span className="h-[22px] w-[22px] rounded-md bg-primary" /><span className="text-[17px] font-bold tracking-[-0.01em] text-ink">TrialIQ</span></Link>
        <nav aria-label="Site" className="hidden flex-1 items-center gap-6 text-sm font-medium text-ink-2 md:flex">
          <Link href="/#problem" className="hover:text-ink">Problem</Link>
          <Link href="/#how" className="hover:text-ink">How it works</Link>
          <Link href="/#checks" className="hover:text-ink">Checks</Link>
          <Link href="/#trust" className="hover:text-ink">Trust</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {signedIn ? <ButtonLink kind="primary" size="sm" href="/dashboard">Open workspace</ButtonLink> : <>
            <ButtonLink size="sm" href="/auth" className="hidden sm:inline-flex">Sign in</ButtonLink>
            <ButtonLink kind="primary" size="sm" href="/auth?demo=1">Try the demo</ButtonLink>
          </>}
        </div>
      </div>
    </header>
  );
}
