import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { siteDescription, siteUrl } from "@/lib/site";
import "./globals.css";

const hind = localFont({
  src: "./fonts/Hind-Regular.ttf",
  variable: "--font-hind",
  weight: "400",
  display: "swap",
});

const yatra = localFont({
  src: "./fonts/YatraOne-Regular.ttf",
  variable: "--font-yatra",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: "Vihar Games · A little play, together", template: "%s | Vihar Games" },
  description: siteDescription,
  applicationName: "Vihar Games",
  openGraph: {
    type: "website",
    siteName: "Vihar Games",
    title: "Vihar Games · A little play, together",
    description: siteDescription,
    url: siteUrl,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${hind.variable} ${yatra.variable}`}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header page-shell">
          <Link className="brand" href="/" aria-label="Vihar Games home">
            <span className="brand-hindi" lang="hi">विहार</span>
            <span className="brand-label">VIHAR GAMES</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link className="nav-link" href="/#collection">The collection <span aria-hidden="true">↗</span></Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer page-shell">
          <p>A little play. A little togetherness.</p>
          <Link href="/">Vihar Games</Link>
        </footer>
      </body>
    </html>
  );
}
