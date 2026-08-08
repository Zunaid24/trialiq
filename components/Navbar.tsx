import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          TrialIQ AI
        </Link>

        <nav className="hidden gap-8 md:flex">
          <Link href="#" className="text-slate-600 hover:text-black">
            Features
          </Link>

          <Link href="#" className="text-slate-600 hover:text-black">
            Modules
          </Link>

          <Link href="#" className="text-slate-600 hover:text-black">
            Docs
          </Link>
        </nav>

        <button className="rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">
              <Link
  href="/dashboard"
  
>
  Launch Workspace
</Link>
        </button>
      </div>
    </header>
  );
}