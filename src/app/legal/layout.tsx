import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8 md:px-6">
      <header className="mb-8 flex items-center justify-between gap-3 border-b border-ink-200 pb-4">
        <Link href="/home">
          <Logo />
        </Link>
        <nav className="flex flex-wrap gap-3 text-xs font-medium text-ink-500">
          <Link href="/legal/disclaimer" className="hover:text-ink-800">
            투자 고지
          </Link>
          <Link href="/legal/terms" className="hover:text-ink-800">
            이용약관
          </Link>
          <Link href="/legal/privacy" className="hover:text-ink-800">
            개인정보
          </Link>
        </nav>
      </header>
      <article className="prose-legal space-y-4 text-sm leading-relaxed text-ink-700">
        {children}
      </article>
      <footer className="mt-12 border-t border-ink-100 pt-4 text-xs text-ink-400">
        <Link href="/home" className="hover:text-ink-600">
          ← 앱으로 돌아가기
        </Link>
      </footer>
    </div>
  );
}
