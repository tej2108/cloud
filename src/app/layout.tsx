import type { Metadata } from "next";
import Link from "next/link";
import { Instrument_Serif, Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
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
    <html
      lang="en"
      className={`${instrument.variable} ${schibsted.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-5">
          <div className="flex items-baseline justify-between gap-4 pb-3">
            <Link href="/" className="group flex items-baseline gap-2">
              <span className="font-display text-3xl leading-none">Trapphus</span>
              <span className="eyebrow hidden sm:inline">Stockholm · BRF health</span>
            </Link>
            <nav className="flex gap-4 sm:gap-6 text-sm">
              <Link href="/" className="hover:text-ochre transition-colors">Associations</Link>
              <Link href="/analyse" className="hover:text-ochre transition-colors">Analyse a report</Link>
              <Link href="/method" className="hover:text-ochre transition-colors">Method</Link>
            </nav>
          </div>
          <div className="rule-double" />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">{children}</main>
        <footer className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-10 pt-16">
          <div className="rule pt-4 flex flex-col sm:flex-row justify-between gap-3 text-xs text-ink-3">
            <p>
              Demo associations and figures are fictional. Grades are an educational model, not financial advice.
            </p>
            <p className="font-mono">Built on BFNAR 2023:1 key ratios</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
