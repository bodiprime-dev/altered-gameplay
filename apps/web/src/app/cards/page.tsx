import { existsSync } from "node:fs";
import { join } from "node:path";

import { filterCards } from "@altered/cards";

import { CardTile } from "@/components/CardTile";
import { loadCards } from "@/lib/cards";

const FACTIONS = ["AX", "BR", "LY", "MU", "NE", "OR", "YZ"];
const TYPES = [
  "HERO",
  "CHARACTER",
  "SPELL",
  "PERMANENT",
  "LANDMARK_PERMANENT",
  "EXPEDITION_PERMANENT",
];
const RARITIES = ["COMMON", "RARE", "UNIQUE"];

export const dynamic = "force-static";

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const datasetPath = join(process.cwd(), "public", "data", "cards.json");
  if (!existsSync(datasetPath)) {
    return (
      <div className="empty-state">
        <p>No card data yet.</p>
        <p>
          Run <code>pnpm ingest</code> at the repo root to fetch the AlteredEquinox dataset.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const text = singleParam(params.q);
  const set = singleParam(params.set);
  const faction = singleParam(params.faction);
  const cardType = singleParam(params.type);
  const rarity = singleParam(params.rarity);

  const cards = await loadCards();
  // Hide tokens / promos / banned by default — they confuse the browse experience.
  const visible = cards.filter(
    (c) => c.cardType !== "TOKEN" && c.cardType !== "TOKEN_MANA" && !c.isBanned,
  );
  const sets = [...new Set(visible.map((c) => c.set.reference))].sort();

  const filtered = filterCards(visible, {
    text,
    set,
    faction,
    cardType,
    rarity,
  });

  return (
    <>
      <form className="filter-bar" method="get">
        <input
          type="search"
          name="q"
          defaultValue={text ?? ""}
          placeholder="Search name, effect, subtype…"
        />
        <select name="set" defaultValue={set ?? ""}>
          <option value="">All sets</option>
          {sets.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="faction" defaultValue={faction ?? ""}>
          <option value="">All factions</option>
          {FACTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select name="type" defaultValue={cardType ?? ""}>
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select name="rarity" defaultValue={rarity ?? ""}>
          <option value="">All rarities</option>
          {RARITIES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </form>
      <div className="results-meta">
        {filtered.length} of {visible.length} cards
      </div>
      <div className="card-grid">
        {filtered.slice(0, 240).map((card) => (
          <CardTile key={card.reference} card={card} />
        ))}
      </div>
      {filtered.length > 240 ? (
        <p className="results-meta" style={{ marginTop: 16 }}>
          Showing first 240. Use the search/filters to narrow down.
        </p>
      ) : null}
    </>
  );
}

function singleParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v && v.length ? v : undefined;
}
