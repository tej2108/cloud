import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { IBM_Plex_Sans } from "next/font/google";
import { SiteNav, SiteNavFallback } from "@/components/site-nav";
import { Logo } from "@/components/icons";
import "./globals.css";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Trapphus: Stockholm BRF health check",
    template: "%s · Trapphus",
  },
  description:
    "Read a housing association's annual report before you buy. Debt, savings, rate sensitivity and maintenance, turned into a clear A–G grade.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plex.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-5 px-4 sm:gap-8 sm:px-6">
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <Logo />
              <span className="text-lg font-bold tracking-tight">Trapphus</span>
            </Link>
            <nav className="no-scrollbar flex h-full gap-4 overflow-x-auto sm:gap-6">
              <Suspense fallback={<SiteNavFallback />}>
                <SiteNav />
              </Suspense>
            </nav>
            <span className="ml-auto hidden shrink-0 items-center gap-2 text-xs text-ink-3 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-up" />
              Stockholm · annual reports 2020–2024
            </span>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-20 border-t border-line bg-surface">
          <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 py-10 text-sm sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <Logo className="h-6 w-6" />
                <span className="font-bold">Trapphus</span>
              </div>
              <p className="mt-3 max-w-sm text-ink-2">
                Grades Stockholm housing associations from their annual reports. The associations shown are
                fictional demo data. The grade is an educational model, not financial advice.
              </p>
            </div>
            <div>
              <p className="label mb-3">Product</p>
              <ul className="space-y-2 text-ink-2">
                <li><Link href="/" className="hover:text-brand">Associations</Link></li>
                <li><Link href="/analyse" className="hover:text-brand">Analyse a report</Link></li>
                <li><Link href="/method" className="hover:text-brand">Method</Link></li>
              </ul>
            </div>
            <div>
              <p className="label mb-3">Sources</p>
              <ul className="space-y-2 text-ink-2">
                <li>
                  <a href="https://www.bolagsverket.se" target="_blank" rel="noreferrer" className="hover:text-brand">
                    Bolagsverket ↗
                  </a>
                </li>
                <li>BFNAR 2023:1 key ratios</li>
              </ul>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
