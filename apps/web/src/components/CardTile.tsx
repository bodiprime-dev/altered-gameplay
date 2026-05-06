import Link from "next/link";

import type { NormalizedCard } from "@altered/cards";

const FACTION_LABEL: Record<string, string> = {
  AX: "Axiom",
  BR: "Bravos",
  LY: "Lyra",
  MU: "Muna",
  NE: "Neutral",
  OR: "Ordis",
  YZ: "Yzmir",
};

export function CardTile({ card, locale = "en_US" }: { card: NormalizedCard; locale?: string }) {
  const name = card.names[locale as keyof typeof card.names] ?? card.name;
  const image = card.imagePaths[locale as keyof typeof card.imagePaths] ?? card.imagePath;
  return (
    <Link href={`/cards/${card.reference}`} className="card-tile">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote source variants, simpler than next/image for now
        <img src={image} alt={name} loading="lazy" className="card-tile-image" />
      ) : (
        <div className="card-tile-image" />
      )}
      <div className="card-tile-body">
        <div className="card-tile-title">{name}</div>
        <div className="card-tile-sub">
          <span>
            <span
              className="faction-badge"
              style={{ background: `var(--${card.faction.toLowerCase()})` }}
            />
            {FACTION_LABEL[card.faction] ?? card.faction}
          </span>
          <span>{card.set.reference}</span>
        </div>
      </div>
    </Link>
  );
}
