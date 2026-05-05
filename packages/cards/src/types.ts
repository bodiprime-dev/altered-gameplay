/**
 * Card types for Altered TCG.
 *
 * The shape mirrors what AlteredEquinox publishes, but normalized:
 * one row per `reference` (e.g. ALT_CORE_B_AX_05_C), localized strings
 * collapsed to the languages we care about, raw effect text kept verbatim
 * (the engine will later parse it into a structured DSL).
 */

export type Locale = "en_US" | "fr_FR" | "es_ES" | "de_DE" | "it_IT";

export type FactionRef = "AX" | "BR" | "LY" | "MU" | "NE" | "OR" | "YZ";

export type CardTypeRef =
  | "HERO"
  | "CHARACTER"
  | "SPELL"
  | "PERMANENT"
  | "LANDMARK_PERMANENT"
  | "EXPEDITION_PERMANENT"
  | "TOKEN"
  | "TOKEN_MANA"
  | "TOKEN_LANDMARK_PERMANENT"
  | "FOILER"
  | (string & {});

export type RarityRef = "COMMON" | "RARE" | "UNIQUE";

export type CardProductRef = "B" | "P" | "C" | "K" | "Y" | string;

/** Translatable string keyed by locale. */
export type Localized = Partial<Record<Locale, string>>;

/**
 * Flat element bag, mirroring the source `elements` field.
 * Strings (not numbers) on purpose — the source uses strings,
 * and some values may be expressions like "X" later.
 */
export interface CardElements {
  MAIN_COST?: string;
  RECALL_COST?: string;
  HAND_COST?: string;
  RESERVE_COST?: string;
  FOREST_POWER?: string;
  MOUNTAIN_POWER?: string;
  OCEAN_POWER?: string;
  PERMANENT?: string;
  RESERVE?: string;
  MAIN_EFFECT?: string;
  ECHO_EFFECT?: string;
  SUPPORT_EFFECT?: string;
  /** Catch-all for fields we haven't modeled yet. */
  [k: string]: string | undefined;
}

export interface NormalizedCard {
  /** Canonical identifier, e.g. "ALT_CORE_B_AX_05_C". */
  reference: string;
  /** Source GUID (ULID), useful for joining with other AlteredEquinox repos. */
  id: string;
  /** Default English-ish display name. */
  name: string;
  /** All localized names. */
  names: Localized;

  cardType: CardTypeRef;
  cardSubTypes: string[];
  rarity: RarityRef;

  set: {
    /** e.g. "CORE", "ALIZE", "BISE". */
    reference: string;
    /** Marketing name, e.g. "Beyond the Gates". */
    name: string;
  };

  faction: FactionRef;

  elements: CardElements;

  /** Verbatim effect text per locale, ready for the engine's effect parser. */
  effects: {
    main?: Localized;
    echo?: Localized;
    support?: Localized;
  };

  collectorNumber: string;
  collectorNumberFormatted?: string;
  cardProduct?: CardProductRef;
  illustrator?: string;
  imagePath?: string;
  imagePaths: Localized;

  isSuspended: boolean;
  isErrated: boolean;
  isBanned: boolean;
  isPromo: boolean;
  isUnique: boolean;
}

export interface CardDataset {
  generatedAt: string;
  source: { repo: string; commit: string; branch: string }[];
  cards: NormalizedCard[];
}
