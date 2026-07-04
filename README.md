# Process Documentation

This directory is a **review artifact** — an honest, exhaustive documentation of how a slide deck is built end-to-end in Guide Mode, and where the process itself is weak.

## Purpose

You (the user, acting as manager/reviewer) asked for a detailed breakdown so you can identify specific vulnerabilities and optimize the overall system. These files are meant to be:

- **Read** — understand the actual mechanics
- **Marked up** — flag issues, add notes, disagree with my self-critique
- **Referenced** — as the shared source-of-truth when we implement optimizations

They are NOT meant for end users of the finished decks.

## Files

| File | What's inside |
|---|---|
| `00-overview.md` | Engagement map, execution gate, layered rollback rule, Guide Mode invariants |
| `01-phase1-strategy.md` | Phase 1: Strategy ("Why & For Whom") — 5 scenarios, 5 dimensions, 12 weaknesses |
| `02-phase2-substance.md` | Phase 2: Substance ("What to Use") — inventory, gap list, research delegation, source map, 16 weaknesses |
| `03-phase3-structure.md` | Phase 3: Structure ("How to Tell the Story") — length, framework, opening/core/closing, cases, charts, allocation, 18 weaknesses |
| `04-phase4-surface.md` | Phase 4: Surface ("How It Looks") — density, visual source, brand assets, type, palette, layouts, chrome, 16 weaknesses |
| `05-phase5-execution-reflection.md` | Phase 5: Execution & Reflection — Part A (build) + Part B (self-review), 23 weaknesses |
| `06-prompt-mechanism.md` | Where the PROMPT/BINDING layer itself is weak — 30 weaknesses across 6 layers, plus 5 cross-cutting patterns |
| `07-models-and-tools.md` | Honest inventory of what tools/models I can and cannot name — with explicit gaps |

## Reading order

**If time-constrained** (30 min or less):
1. `00-overview.md` (5 min)
2. `07-models-and-tools.md` (10 min) — grounds what's actually happening
3. `06-prompt-mechanism.md` (15 min) — the highest-leverage systemic issues

**If reviewing thoroughly** (2+ hours):
1. `00-overview.md`
2. `07-models-and-tools.md`
3. `06-prompt-mechanism.md`
4. `01`–`05` in phase order
5. Return to `06` after reading phases — cross-reference

## Weaknesses catalogued

- Phase 1: **12** weaknesses
- Phase 2: **16** weaknesses
- Phase 3: **18** weaknesses
- Phase 4: **16** weaknesses
- Phase 5: **23** weaknesses
- Prompt mechanism: **30** weaknesses + **5** cross-cutting patterns

**Total: 115 identified weaknesses** with proposed fixes, ranked by impact.

## How each phase file is structured

Every phase file (`01`–`05`) has the same sections:

1. **Purpose** — what this phase accomplishes
2. **Guiding principle** — the one-line rule that shapes every task
3. **Duration** — expected rounds of consultation
4. **Inputs consumed** — what comes from prior phases
5. **Outputs produced** — the artifacts that come out
6. **Gate criteria** — how we know it's done
7. **Task N** (each task): sub-tasks + tool binding + prompt rules + failure modes
8. **Tool inventory** — what's allowed / forbidden
9. **Weaknesses & optimization opportunities** — the actionable list
10. **Handoff** — what the next phase receives

## Where to look for optimization opportunities

If you're synthesizing across the docs:

- **Structural issues** (process design) → in each phase's "Weaknesses" section
- **Systemic issues** (rules stated but not enforced) → `06-prompt-mechanism.md`
- **Model / tool blind spots** → `07-models-and-tools.md`
- **Recurring patterns** → look for the same weakness appearing across multiple phases (that's systemic, higher priority than isolated fix)

## The single systemic pattern

Across all 115 weaknesses, the most common pattern is:

> **Rules are stated as prose, not enforced as checks.**

Most of my failures aren't from missing rules — they're from rules that exist but drift under attention decay over long builds. The fix is not "add more rules"; it's "convert existing prose rules into procedural checks that run at specific points."

See `06-prompt-mechanism.md` sections CX1–CX5 for detail.

## What comes next

After you've reviewed:

1. **Prioritize** — pick the 5–10 highest-impact fixes across all phases
2. **Sequence** — which fixes unlock others?
3. **Test** — run the optimized process on a real deck to see the difference
4. **Iterate** — some fixes will surface new weaknesses; that's expected

I'm ready to work through any subset of these files with you in depth.
