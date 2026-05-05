import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { CardDataset, NormalizedCard } from "@altered/cards";

let cache: CardDataset | null = null;

export async function loadDataset(): Promise<CardDataset> {
  if (cache) return cache;
  const file = join(process.cwd(), "public", "data", "cards.json");
  const text = await readFile(file, "utf8");
  cache = JSON.parse(text) as CardDataset;
  return cache;
}

export async function loadCards(): Promise<NormalizedCard[]> {
  return (await loadDataset()).cards;
}
