import Link from "next/link";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#0B0909] py-5 px-6">
        <Link href="/" className="font-display text-xl font-bold text-white tracking-tight hover:opacity-80 transition-opacity">
          SPOTSPACE
        </Link>
      </header>
      <div className="flex justify-center px-6 py-16">
        <div className="w-full max-w-[540px] bg-white p-6 md:p-8 rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}