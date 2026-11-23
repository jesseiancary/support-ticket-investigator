# Support Ticket Investigator

[![CI](https://github.com/jesseiancary/support-ticket-investigator/actions/workflows/ci.yml/badge.svg)](https://github.com/jesseiancary/support-ticket-investigator/actions/workflows/ci.yml)

> ⚠️ Work in progress. This is a stub README — the full portfolio-facing README
> (architecture, live demo, eval numbers, screenshots) is authored in Phase 6 (PR 6.7).
> The CI badge above is a placeholder, finalized in Phase 6.

An AI assistant that investigates customer support tickets using Retrieval-Augmented
Generation (RAG) and produces structured, evidence-cited engineering investigation
reports with follow-up Q&A. See [`docs/`](docs/) for the phased implementation plan.

## Prerequisites

- Docker + Docker Compose
- Node.js 22+ and `pnpm` (`corepack enable`)
- An OpenAI API key (needed from Phase 2 onward; not required for Phase 1)

## Quick start

```bash
cp .env.example .env    # fill in OPENAI_API_KEY when needed
pnpm install
make up                 # build + start db, api, web (all report healthy)
make test               # run the unit Vitest suite (fast, no Docker)
```

Common targets: `make up` / `make down` / `make logs` / `make test` /
`make test-integration` / `make lint` / `make typecheck` / `make build`. Run `make help`
for the full list.

`make test` runs the fast, Docker-free unit suite. The Testcontainers DB integration
tests run separately via `make test-integration` (needs Docker; they boot their own
`pgvector` container).

## Troubleshooting

### `make up` fails with "all predefined address pools have been fully subnetted"

Docker could not auto-allocate a subnet for the compose network. This is a
**host/daemon-level** condition (seen on WSL2 with Docker in mirrored networking mode,
where the daemon's allocator treats its default pools — `172.16.0.0/12` and
`192.168.0.0/16` — as overlapping Windows-side virtual adapters), not a problem with
this project's compose file. It affects every Docker project on the machine at once.

**Recommended fix — give the daemon explicit address pools it can actually use.**
Create or edit `/etc/docker/daemon.json`:

```json
{
  "default-address-pools": [
    { "base": "10.210.0.0/16", "size": 24 },
    { "base": "10.211.0.0/16", "size": 24 }
  ]
}
```

Then restart the engine (`sudo systemctl restart docker`, or
`sudo service docker restart`) and re-run `make up`. Pick a `base` range that nothing
on your host already routes (the `10.2xx` ranges above are usually clear).

**Alternatives:**

- Switch WSL out of mirrored networking: set `networkingMode=NAT` under `[wsl2]` in
  `%UserProfile%\.wslconfig`, then `wsl --shutdown`.
- Pin an explicit subnet on the `sti` network in a local `docker-compose.override.yml`
  (explicit subnets bypass the broken auto-allocator).
