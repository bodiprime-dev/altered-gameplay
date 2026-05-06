import { notFound } from "next/navigation";

import type { NormalizedCard } from "@altered/cards";

import { loadCards } from "@/lib/cards";

export const dynamicParams = true;

export async function generateStaticParams() {
  // Pre-render the most common page; deeper pages are generated on demand.
  return [];
}

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const cards = await loadCards();
  const card = cards.find((c) => c.reference === reference);
  if (!card) notFound();

  const locale = "en_US";
  const name = card.names[locale] ?? card.name;
  const image = card.imagePaths[locale] ?? card.imagePath;

  return (
    <div className="card-detail">
      <div>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} />
        ) : null}
      </div>
      <div>
        <h1>{name}</h1>
        <div className="meta">
          {card.cardType}
          {card.cardSubTypes.length ? ` · ${card.cardSubTypes.join(", ")}` : ""} ·{" "}
          {card.set.name} · {card.faction} · {card.rarity}
          {card.illustrator ? ` · art by ${card.illustrator}` : null}
        </div>
        <Stats card={card} />
        <Effects card={card} />
        <p className="results-meta">
          <code>{card.reference}</code>
        </p>
      </div>
    </div>
  );
}

function Stats({ card }: { card: NormalizedCard }) {
  const e = card.elements;
  const isCharacter = card.cardType === "CHARACTER" || card.cardType === "HERO";
  return (
    <div className="stat-grid">
      <Cell label="Hand" value={e.MAIN_COST} />
      <Cell label="Reserve" value={e.RECALL_COST} />
      {isCharacter ? (
        <>
          <Cell label="Forest" value={e.FOREST_POWER} />
          <Cell label="Mountain" value={e.MOUNTAIN_POWER} />
          <Cell label="Ocean" value={e.OCEAN_POWER} />
        </>
      ) : (
        <>
          <Cell label="Permanent" value={e.PERMANENT} />
          <Cell label="Reserve+" value={e.RESERVE} />
          <Cell label="" value={undefined} />
        </>
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string | undefined }) {
  if (!label && !value) return <div />;
  return (
    <div className="stat-cell">
      <div className="label">{label}</div>
      <div className="value">{value ?? "—"}</div>
    </div>
  );
}

function Effects({ card }: { card: NormalizedCard }) {
  const blocks: { label: string; text: string | undefined }[] = [
    { label: "Main effect", text: card.elements.MAIN_EFFECT },
    { label: "Echo effect", text: card.elements.ECHO_EFFECT },
    { label: "Support effect", text: card.elements.SUPPORT_EFFECT },
  ];
  return (
    <>
      {blocks.map((b) =>
        b.text ? (
          <div key={b.label} className="effect-block">
            <div className="label">{b.label}</div>
            {b.text}
          </div>
        ) : null,
      )}
    </>
  );
}
