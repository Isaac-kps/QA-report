# DEX Code Quality Report

A React dashboard that visualises the DEX code-quality posture across all active engineering projects. Sourced from the Confluence page **“Quality Report (Initial)”** ([CDIT space](https://afa-cdi.atlassian.net/wiki/spaces/CDIT/pages/1780318221/Quality+Report+Initial)) and converted into an editable JSON document.

## What it shows

- **Coverage Matrix** — every project scored on Unit Tests, SonarQube Cloud, and E2E testing, with coverage, PR-reviewer counts, PR rules, and additional notes. Searchable and filterable by group.
- **SonarQube Quality Gate** — recommended gate settings and target ratings.
- **Proposed Plan** — the 3-phase rollout, with open questions surfaced inline.
- **Open Questions** — outstanding decisions to resolve.

## Editing the report

All content lives in a single file — no code changes needed:

```
src/data/quality-report.json
```

Each project entry uses `status` values of `pass` (in place), `fail` (missing), or `na` (not applicable). Summary stats, filters, and the matrix all derive from this file automatically.

## Running locally

```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Stack

- React 18 + Vite 5
- Zero runtime dependencies beyond React — data is a static JSON import
