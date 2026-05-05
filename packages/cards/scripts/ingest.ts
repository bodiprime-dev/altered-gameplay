/**
 * Ingest the AlteredEquinox non-unique card data.
 *
 *   pnpm ingest                  # default: clones cards-nonunique
 *   pnpm ingest -- --offline     # don't fetch, reuse existing .cache
 *
 * What it does:
 *   1. Shallow-clones AlteredEquinox/cards-nonunique into .cache/
 *      (or `git fetch` + `git reset --hard` if already cloned).
 *   2. Walks .cache/cards-nonunique/json/<SET>/.../*.json
 *   3. Parses each file, normalizes via parseRawCard().
 *   4. Writes dist/cards.json (full dataset) and an asset to
 *      apps/web/public/data/cards.json for the web app to consume.
 */

import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { parseRawCard } from "../src/parse";
import type { CardDataset, NormalizedCard } from "../src/types";

const exec = promisify(execFile);

const REPOS = [
  {
    name: "cards-nonunique",
    url: "https://github.com/AlteredEquinox/cards-nonunique.git",
    branch: "main",
  },
] as const;

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const offline = args.has("--offline");

  const here = dirname(fileURLToPath(import.meta.url));
  const pkgRoot = resolve(here, "..");
  const repoRoot = resolve(pkgRoot, "..", "..");
  const cacheDir = join(pkgRoot, ".cache");
  const distDir = join(pkgRoot, "dist");
  const webPublic = join(repoRoot, "apps", "web", "public", "data");

  await mkdir(cacheDir, { recursive: true });
  await mkdir(distDir, { recursive: true });
  await mkdir(webPublic, { recursive: true });

  const sources: CardDataset["source"] = [];
  const allCards: NormalizedCard[] = [];

  for (const repo of REPOS) {
    const repoDir = join(cacheDir, repo.name);
    if (!offline) {
      await ensureRepo(repoDir, repo.url, repo.branch);
    } else if (!existsSync(repoDir)) {
      throw new Error(`--offline given but ${repoDir} does not exist; run without --offline first.`);
    }

    const commit = (await exec("git", ["rev-parse", "HEAD"], { cwd: repoDir })).stdout.trim();
    sources.push({ repo: repo.url, commit, branch: repo.branch });

    const jsonRoot = join(repoDir, "json");
    let count = 0;
    let skipped = 0;
    for await (const file of walkJson(jsonRoot)) {
      const text = await readFile(file, "utf8");
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        skipped++;
        continue;
      }
      const card = parseRawCard(raw);
      if (!card) {
        skipped++;
        continue;
      }
      allCards.push(card);
      count++;
    }
    console.log(`[${repo.name}] parsed ${count} cards (skipped ${skipped})`);
  }

  // Deduplicate by reference (some sets contain alt-art reprints with same ref).
  const dedup = new Map<string, NormalizedCard>();
  for (const c of allCards) dedup.set(c.reference, c);
  const cards = [...dedup.values()].sort((a, b) => a.reference.localeCompare(b.reference));

  const dataset: CardDataset = {
    generatedAt: new Date().toISOString(),
    source: sources,
    cards,
  };

  await writeFile(join(distDir, "cards.json"), JSON.stringify(dataset));
  await writeFile(join(webPublic, "cards.json"), JSON.stringify(dataset));

  // Also a tiny stats file — useful for sanity checks during dev.
  const stats = summarize(cards);
  await writeFile(join(distDir, "stats.json"), JSON.stringify(stats, null, 2));
  console.log(`Wrote ${cards.length} cards to dist/cards.json and apps/web/public/data/cards.json`);
  console.log("Stats:", JSON.stringify(stats, null, 2));
}

async function ensureRepo(dir: string, url: string, branch: string): Promise<void> {
  if (existsSync(join(dir, ".git"))) {
    console.log(`[git] updating ${dir}`);
    await exec("git", ["fetch", "--depth=1", "origin", branch], { cwd: dir });
    await exec("git", ["reset", "--hard", `origin/${branch}`], { cwd: dir });
    return;
  }
  console.log(`[git] cloning ${url} -> ${dir}`);
  await exec("git", ["clone", "--depth=1", "--branch", branch, url, dir]);
}

async function* walkJson(root: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true, encoding: "utf8" });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      yield* walkJson(full);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      yield full;
    }
  }
}

function summarize(cards: NormalizedCard[]) {
  const bySet = new Map<string, number>();
  const byFaction = new Map<string, number>();
  const byType = new Map<string, number>();
  for (const c of cards) {
    bySet.set(c.set.reference, (bySet.get(c.set.reference) ?? 0) + 1);
    byFaction.set(c.faction, (byFaction.get(c.faction) ?? 0) + 1);
    byType.set(c.cardType, (byType.get(c.cardType) ?? 0) + 1);
  }
  return {
    total: cards.length,
    bySet: Object.fromEntries([...bySet].sort()),
    byFaction: Object.fromEntries([...byFaction].sort()),
    byType: Object.fromEntries([...byType].sort()),
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
