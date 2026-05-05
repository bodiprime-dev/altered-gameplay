export * from "./types";
export { parseRawCard } from "./parse";
export {
  STANDARD,
  validateDeck,
  type DeckFormat,
  type DeckList,
  type ValidationIssue,
  type ValidationResult,
} from "./deck";

import type { CardDataset, NormalizedCard } from "./types";

export function indexByReference(cards: NormalizedCard[]): Map<string, NormalizedCard> {
  return new Map(cards.map((c) => [c.reference, c]));
}

export interface CardFilter {
  set?: string | undefined;
  faction?: string | undefined;
  cardType?: string | undefined;
  rarity?: string | undefined;
  text?: string | undefined;
}

export function filterCards(cards: NormalizedCard[], filter: CardFilter): NormalizedCard[] {
  const text = filter.text?.toLowerCase().trim();
  return cards.filter((c) => {
    if (filter.set && c.set.reference !== filter.set) return false;
    if (filter.faction && c.faction !== filter.faction) return false;
    if (filter.cardType && c.cardType !== filter.cardType) return false;
    if (filter.rarity && c.rarity !== filter.rarity) return false;
    if (text) {
      const hay = [
        c.name,
        c.reference,
        c.elements.MAIN_EFFECT ?? "",
        c.elements.ECHO_EFFECT ?? "",
        c.elements.SUPPORT_EFFECT ?? "",
        c.cardSubTypes.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export type { CardDataset };
