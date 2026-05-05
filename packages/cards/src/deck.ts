import type { NormalizedCard } from "./types";

/**
 * Constructed-format deck validation rules.
 *
 * Source: Altered Comprehensive Rules + community FAQ. Encoded as data, not
 * baked into the validator, so we can support multiple formats (Standard,
 * Limited, Sealed, custom) by swapping `DeckFormat`.
 */
export interface DeckFormat {
  name: string;
  /** Required count of non-Hero cards (default Standard: 39). */
  nonHeroCount: number;
  /** Maximum copies of a single non-Hero card by reference. Standard: 3. */
  maxCopies: number;
  /** Whether unique-rarity cards are allowed. */
  allowUniques: boolean;
  /** Whether neutral-faction cards may be added regardless of Hero faction. */
  allowNeutralFaction: boolean;
}

export const STANDARD: DeckFormat = {
  name: "Standard",
  nonHeroCount: 39,
  maxCopies: 3,
  allowUniques: true,
  allowNeutralFaction: true,
};

export interface DeckList {
  /** Card reference of the Hero. */
  hero: string;
  /** Map of non-Hero card reference -> copy count. */
  cards: Record<string, number>;
}

export interface ValidationIssue {
  level: "error" | "warning";
  code: string;
  message: string;
  /** Card reference the issue refers to, when applicable. */
  reference?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  totals: {
    hero: NormalizedCard | null;
    nonHeroCount: number;
    factions: Record<string, number>;
  };
}

export function validateDeck(
  deck: DeckList,
  catalog: Map<string, NormalizedCard>,
  format: DeckFormat = STANDARD,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  const hero = catalog.get(deck.hero) ?? null;
  if (!hero) {
    issues.push({
      level: "error",
      code: "HERO_MISSING",
      message: `Hero ${deck.hero} not found in catalog`,
      reference: deck.hero,
    });
  } else if (hero.cardType !== "HERO") {
    issues.push({
      level: "error",
      code: "HERO_NOT_HERO",
      message: `${hero.name} is not a Hero card`,
      reference: hero.reference,
    });
  }

  let nonHeroCount = 0;
  const factions: Record<string, number> = {};
  const heroFaction = hero?.faction;

  for (const [ref, raw] of Object.entries(deck.cards)) {
    const count = Math.max(0, Math.floor(raw));
    if (count === 0) continue;
    nonHeroCount += count;

    const card = catalog.get(ref);
    if (!card) {
      issues.push({
        level: "error",
        code: "CARD_MISSING",
        message: `Card ${ref} not found`,
        reference: ref,
      });
      continue;
    }
    if (card.cardType === "HERO") {
      issues.push({
        level: "error",
        code: "EXTRA_HERO",
        message: `${card.name} is a Hero — only one Hero allowed and it goes in deck.hero`,
        reference: ref,
      });
      continue;
    }
    if (card.isBanned) {
      issues.push({
        level: "error",
        code: "CARD_BANNED",
        message: `${card.name} is banned`,
        reference: ref,
      });
    }
    if (card.isSuspended) {
      issues.push({
        level: "warning",
        code: "CARD_SUSPENDED",
        message: `${card.name} is suspended`,
        reference: ref,
      });
    }
    if (!format.allowUniques && card.isUnique) {
      issues.push({
        level: "error",
        code: "UNIQUE_NOT_ALLOWED",
        message: `${card.name} is a Unique and not allowed in ${format.name}`,
        reference: ref,
      });
    }
    if (count > format.maxCopies) {
      issues.push({
        level: "error",
        code: "COPY_LIMIT",
        message: `${card.name}: ${count} copies > limit of ${format.maxCopies}`,
        reference: ref,
      });
    }

    factions[card.faction] = (factions[card.faction] ?? 0) + count;

    if (heroFaction && card.faction !== heroFaction) {
      const isNeutral = card.faction === "NE";
      if (!isNeutral || !format.allowNeutralFaction) {
        issues.push({
          level: "error",
          code: "FACTION_MISMATCH",
          message: `${card.name} (${card.faction}) does not match Hero faction ${heroFaction}`,
          reference: ref,
        });
      }
    }
  }

  if (nonHeroCount !== format.nonHeroCount) {
    issues.push({
      level: "error",
      code: "DECK_SIZE",
      message: `Deck has ${nonHeroCount} non-Hero cards; ${format.name} requires exactly ${format.nonHeroCount}`,
    });
  }

  return {
    ok: issues.every((i) => i.level !== "error"),
    issues,
    totals: { hero, nonHeroCount, factions },
  };
}
