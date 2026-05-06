import { existsSync } from "node:fs";
import { join } from "node:path";

import { loadDataset } from "@/lib/cards";

export default async function HomePage() {
  const datasetPath = join(process.cwd(), "public", "data", "cards.json");
  const hasDataset = existsSync(datasetPath);

  let total = 0;
  let bySet: Record<string, number> = {};
  if (hasDataset) {
    const ds = await loadDataset();
    total = ds.cards.length;
    bySet = ds.cards.reduce<Record<string, number>>((acc, c) => {
      acc[c.set.reference] = (acc[c.set.reference] ?? 0) + 1;
      return acc;
    }, {});
  }

  return (
    <div className="hero">
      <h1>Altered Gameplay</h1>
      <p>
        Community card viewer, deck builder and online play for Altered TCG. Card data is sourced
        from the AlteredEquinox public repositories — non-unique cards across all 7+ sets.
      </p>
      {hasDataset ? (
        <p className="results-meta">
          {total} cards loaded across {Object.keys(bySet).length} sets:{" "}
          {Object.entries(bySet)
            .sort((a, b) => b[1] - a[1])
            .map(([set, n]) => `${set} (${n})`)
            .join(", ")}
        </p>
      ) : (
        <p className="results-meta">
          No card data yet — run <code>pnpm ingest</code> to fetch from AlteredEquinox.
        </p>
      )}
      <div className="cta-row">
        <a className="cta" href="/cards">
          Browse cards
        </a>
        <a className="cta secondary" href="/decks">
          Deck builder
        </a>
      </div>
    </div>
  );
}
