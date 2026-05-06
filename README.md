# altered-gameplay

Community project to play [Altered TCG](https://www.altered.gg/) online — card viewer, deck builder, and (later) full gameplay engine. The official game is no longer being developed; this project preserves the experience for the community.

## Status

Early alpha. Currently shipping:

- **Card viewer** — browse all non-unique cards from the 7+ sets exposed by [AlteredEquinox](https://github.com/AlteredEquinox)
- **Deck builder** — skeleton (validation rules in progress)

Coming next:

- Game engine (deterministic, event-sourced)
- Real-time multiplayer (lobby, matchmaking)

## Architecture

Monorepo (pnpm workspaces):

| Package | Role |
|---|---|
| `packages/cards` | Card types + ingestion pipeline (pulls from AlteredEquinox repos) |
| `packages/engine` | (planned) Pure deterministic game engine |
| `apps/web` | Next.js client (card viewer, deck builder) — deploys to Vercel |
| `apps/server` | (planned) Game server — deploys to Fly.io |

## Quickstart

```bash
pnpm install
pnpm ingest        # clones AlteredEquinox/cards-nonunique, normalizes JSON
pnpm dev           # starts the web app on http://localhost:3000
```

## Card data

All card data is sourced from [github.com/AlteredEquinox](https://github.com/AlteredEquinox). The ingestion job clones the public repos into `packages/cards/.cache/` (gitignored), then exports a normalized JSON dataset to `packages/cards/dist/cards.json`.

## License

Card data, names, artwork and lore belong to Equinox / Altered. This project is non-commercial, community-run, for the preservation and continued play of a game that is no longer maintained by its publisher.
