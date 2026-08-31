import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL, HANDLE } from "@/lib/chain";

/**
 * Two faces, substituted for the reference's two under §4.3 of the clone brief.
 *
 * The reference sets prose in a proprietary geometric sans and every label and
 * numeral in a mono. Neither is available to us: one is not licensed for sale,
 * and the other, while open, is the single most reference-identifying string in
 * their stylesheet — using it would fail our own grep gate.
 *
 * Archivo is a grotesque with a comparable x-height and width distribution and
 * a matching 400/500/600 range. IBM Plex Mono is a 600-unit-advance mono, the
 * same advance class as the face it replaces, so uppercase button labels
 * occupy the measured widths without retuning tracking. Both are SIL OFL.
 * Logged in DEVIATIONS.md.
 */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-archivo",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

const description =
  "Every dead token on Robinhood Chain still has real money in its pool. The Graveyard measures how much, aggregates the supply nobody can use alone, sells it once and splits what comes out.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Graveyard — salvage for dead pools on Robinhood Chain",
    template: "%s — The Graveyard",
  },
  description,
  openGraph: {
    title: "The Graveyard",
    description,
    url: SITE_URL,
    siteName: "The Graveyard",
    type: "website",
  },
  twitter: { card: "summary_large_image", site: HANDLE, title: "The Graveyard", description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0d10",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
