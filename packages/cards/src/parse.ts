import type {
  CardElements,
  CardTypeRef,
  FactionRef,
  Locale,
  Localized,
  NormalizedCard,
  RarityRef,
} from "./types";

/**
 * Parses one raw AlteredEquinox card JSON object into our normalized shape.
 * The source schema is loose — we extract the fields we care about and ignore
 * the rest. Anything missing is left undefined rather than thrown on, so a
 * single odd card doesn't break the whole ingestion.
 */
export function parseRawCard(raw: unknown): NormalizedCard | null {
  if (!isObject(raw)) return null;

  const reference = getString(raw, "reference");
  const id = getString(raw, "id");
  const name = getString(raw, "name") ?? reference ?? "";
  if (!reference || !id) return null;

  const cardType = (getNestedString(raw, ["cardType", "reference"]) ?? "CHARACTER") as CardTypeRef;
  const rarity = (getNestedString(raw, ["rarity", "reference"]) ?? "COMMON") as RarityRef;
  const faction = (getNestedString(raw, ["mainFaction", "reference"]) ?? "NE") as FactionRef;
  const setReference = getNestedString(raw, ["cardSet", "reference"]) ?? "UNKNOWN";
  const setName = getNestedString(raw, ["cardSet", "name"]) ?? setReference;

  const subTypes = Array.isArray(raw["cardSubTypes"])
    ? raw["cardSubTypes"]
        .map((s) => (isObject(s) ? getString(s, "reference") ?? getString(s, "name") : null))
        .filter((s): s is string => !!s)
    : [];

  const elements: CardElements = isObject(raw["elements"])
    ? Object.fromEntries(
        Object.entries(raw["elements"]).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      )
    : {};

  const names = collectLocalizedField(raw["translations"], "name");
  const imagePaths = collectLocalizedField(raw["translations"], "image");

  const effects: NormalizedCard["effects"] = {};
  const main = collectEffectText(raw, "MAIN_EFFECT");
  if (main) effects.main = main;
  const echo = collectEffectText(raw, "ECHO_EFFECT");
  if (echo) effects.echo = echo;
  const support = collectEffectText(raw, "SUPPORT_EFFECT");
  if (support) effects.support = support;

  const out: NormalizedCard = {
    reference,
    id,
    name,
    names,
    cardType,
    cardSubTypes: subTypes,
    rarity,
    set: { reference: setReference, name: setName },
    faction,
    elements,
    effects,
    collectorNumber: getString(raw, "collectorNumber") ?? "",
    imagePaths,
    isSuspended: !!raw["isSuspended"],
    isErrated: !!raw["isErrated"],
    isBanned: !!raw["isBanned"],
    isPromo: cardType !== "HERO" && /_(P|Y|K)$/.test(reference),
    isUnique: rarity === "UNIQUE",
  };
  const formatted = getString(raw, "collectorNumberFormatted");
  if (formatted) out.collectorNumberFormatted = formatted;
  const product = getNestedString(raw, ["cardProduct", "reference"]);
  if (product) out.cardProduct = product;
  const illustrator = getNestedString(raw, ["illustrator", "nickName"]);
  if (illustrator) out.illustrator = illustrator;
  const imagePath = getString(raw, "imagePath");
  if (imagePath) out.imagePath = imagePath;
  return out;
}

const KNOWN_LOCALES: Locale[] = ["en_US", "fr_FR", "es_ES", "de_DE", "it_IT"];

function collectLocalizedField(translations: unknown, key: string): Localized {
  if (!isObject(translations)) return {};
  const out: Localized = {};
  for (const locale of KNOWN_LOCALES) {
    const node = translations[locale];
    if (isObject(node)) {
      const v = node[key];
      if (typeof v === "string") out[locale] = v;
    }
  }
  return out;
}

/**
 * Extract the localized effect text by walking cardElements[].cardEffectDisplays[]
 * Returns undefined if no such effect exists for this card.
 */
function collectEffectText(raw: Record<string, unknown>, kind: string): Localized | undefined {
  const flat = isObject(raw["elements"]) ? raw["elements"][kind] : undefined;
  if (typeof flat !== "string" || flat.length === 0) return undefined;

  const out: Localized = { en_US: flat };

  if (Array.isArray(raw["cardElements"])) {
    for (const el of raw["cardElements"]) {
      if (!isObject(el)) continue;
      if (getNestedString(el, ["cardElementType", "reference"]) !== kind) continue;
      const displays = el["cardEffectDisplays"];
      if (!Array.isArray(displays)) continue;
      for (const display of displays) {
        if (!isObject(display)) continue;
        const effect = display["cardEffect"];
        if (!isObject(effect)) continue;
        const elements = effect["cardEffectElements"];
        if (!Array.isArray(elements)) continue;
        for (const node of elements) {
          if (!isObject(node)) continue;
          const tr = node["translations"];
          if (!isObject(tr)) continue;
          for (const locale of KNOWN_LOCALES) {
            const t = tr[locale];
            if (isObject(t) && typeof t["text"] === "string") {
              const prev = out[locale];
              out[locale] = prev ? `${prev}\n${t["text"]}` : t["text"];
            }
          }
        }
      }
    }
  }

  return out;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function getString(o: Record<string, unknown>, k: string): string | undefined {
  const v = o[k];
  return typeof v === "string" ? v : undefined;
}

function getNestedString(o: Record<string, unknown>, path: string[]): string | undefined {
  let cur: unknown = o;
  for (const segment of path) {
    if (!isObject(cur)) return undefined;
    cur = cur[segment];
  }
  return typeof cur === "string" ? cur : undefined;
}
