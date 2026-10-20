## What changed

<!-- One or two sentences. Link the PRD feature (F-xx) and the 07 checklist item. -->

## Product truth

- [ ] Every claim about the CB-POS app cites a fact ID from `docs/00-CBPOS_FACTS.md` and matches it
- [ ] Nothing marked `open` in `docs/08-UPSTREAM_REQUESTS.md` is advertised

## Design gates (CLAUDE.md §7) — required for any UI change

| Skill | Run? | Result |
|---|---|---|
| `hallmark` pre-emit critique | | `P_ H_ E_ S_ R_ V_` (all ≥ 3) |
| `hallmark audit <route>` | | slop-test gate failures: |
| `impeccable audit` + `critique` | | open findings / accepted exceptions: |
| `emil-design-eng` (components, motion) | | |
| `review-animations` (if motion changed) | | verdict: |

- [ ] Screenshots attached: `en` / `si` / `ta`, light + dark, 320 / 375 / 414 / 768 / 1280 px
- [ ] Anti-slop checklists in `CLAUDE.md §8` ticked

## Checks

- [ ] lint, typecheck, test, i18n:check pass
- [ ] E2E for the affected flow passes in all three locales with zero axe violations
