import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Altered Gameplay",
  description: "Community-run card viewer, deck builder and online play for Altered TCG.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a href="/" className="brand">
            Altered Gameplay
          </a>
          <nav className="site-nav">
            <a href="/cards">Cards</a>
            <a href="/decks">Decks</a>
          </nav>
        </header>
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          Community project · card data from{" "}
          <a href="https://github.com/AlteredEquinox" target="_blank" rel="noreferrer">
            AlteredEquinox
          </a>
          . Altered TCG is the property of Equinox.
        </footer>
      </body>
    </html>
  );
}
