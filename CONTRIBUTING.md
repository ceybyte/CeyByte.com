# Contributing

Thanks for helping build ceybyte.com. This file covers the workflow. The rules for code, design and copy are in [`CLAUDE.md`](CLAUDE.md), and they apply to people and AI agents alike.

## Before you start

1. Read [`CLAUDE.md`](CLAUDE.md) on the branch you're working on (`main` = VPS architecture, `free` = $0 architecture).
2. Find the item you're building in [`docs/07-IMPLEMENTATION_PLAN.md`](docs/07-IMPLEMENTATION_PLAN.md) and its acceptance criteria in [`docs/01-PRD.md`](docs/01-PRD.md).
3. For anything that describes the CB POS app, get the local facts audit (`docs/00-CBPOS_FACTS.md`, not committed) from a maintainer.
4. For UI work, install the design skills (`CLAUDE.md §7.1`).

## Branches

| Branch | Purpose |
|---|---|
| `main` | VPS architecture. Always deployable once production exists |
| `free` | $0/month architecture. Always deployable |
| `feat/<scope>-<slug>` | New work, branched from `main` or `free` |
| `fix/<scope>-<slug>` | Fixes |

A change that applies to both architectures (copy, design, product facts) goes to `main` first and is cherry-picked to `free` in a separate PR.

## Commits

Conventional Commits, terse, imperative, explaining *why* when it isn't obvious:

```
feat(gate): add GPS detect to download step 2
fix(map): keep supporter ring on clusters at zoom 13
docs(trd): document Garage CORS for presigned PUT
```

Scopes: `prd, trd, design, flow, schema, screens, plan, app, api, db, auth, map, docs, gate, donate, feedback, blog, admin, i18n, ui, motion, worker, ops, ci`.

One logical change per commit. Commit as each checklist item is done.

## Pull requests

- Fill in [the PR template](.github/pull_request_template.md), including the design-gate results for any UI change.
- Tick the matching box in `docs/07-IMPLEMENTATION_PLAN.md` in the same PR.
- CI must be green: lint, typecheck, tests, `i18n:check`, E2E in `en`, `si` and `ta`.
- Every product claim cites a fact ID from the facts audit.

## Translations

Sinhala and Tamil strings are written by native speakers. Agents and non-native contributors may add `si`/`ta` keys only with the value `[[TRANSLATE]]`, which blocks production deploys until a translator replaces it.

## Reporting bugs

- **Website bugs:** open an issue with the "Website bug" template.
- **CB POS app bugs:** use the app's feedback channels, not this repo (see the issue chooser).
- **Security issues:** see [`SECURITY.md`](SECURITY.md). Never in public issues.
