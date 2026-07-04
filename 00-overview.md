# 00 — Engagement Overview

This directory documents the *actual mechanics* of how a slide deck gets built end-to-end in Guide Mode. It is intended as a review artifact: read it, mark it up, and use it to identify optimization holes in the process itself.

Each phase file (`01`–`05`) exhaustively enumerates: purpose, inputs, per-task tool/prompt bindings, outputs, gate criteria, failure modes, and prompt-mechanism weaknesses. `06` covers the prompt/binding layer itself. `07` is an honest inventory of tools and — where I actually know it — models.

---

## The engagement is a 5-phase consultation with hard gates

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1 — STRATEGY ("Why & For Whom")                      │
│  Establish audience, purpose, delivery context, success     │
│  metric. Produce Strategy Summary.                          │
│  Tools allowed: question tool, file read (user materials)   │
│  Tools forbidden: slide-creation, image-gen, research       │
│  Exit: explicit user approval on Strategy Summary           │
└──────────────┬──────────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2 — SUBSTANCE ("What to Use")                        │
│  Inventory user materials, identify gaps, delegate research │
│  to sub-agent, extract Core Message, build per-slide        │
│  source map. Satisfy raw-data sufficiency gate.             │
│  Tools allowed: file read, PPTX/PDF import, research        │
│    sub-agent dispatch, question tool                        │
│  Tools forbidden: slide-creation, image-gen                 │
│  Exit: material sufficient + Core Message locked +          │
│    source map complete, user approval                       │
└──────────────┬──────────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3 — STRUCTURE ("How to Tell the Story") — CRITICAL   │
│  Length, framework, opening/core/closing, cases, charts,    │
│  page allocation, final outline. Section-by-section.        │
│  Tools allowed: question tool, file read/write (internal    │
│    drafts)                                                  │
│  Tools forbidden: slide-creation, image-gen, research       │
│    (research means loop back to Phase 2)                    │
│  Exit: user explicitly approves FINAL sealed outline        │
└──────────────┬──────────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 4 — SURFACE ("How It Looks")                         │
│  Information density, visual source, brand assets, type     │
│  system, palette, layouts, chrome. Produce Design Summary.  │
│  Tools allowed: question tool, file read (skills, brand),   │
│    skill loader, PPTX/PDF import for reference              │
│  Tools forbidden: slide-creation, image-gen, screenshot     │
│  Exit: user explicitly approves Design Summary              │
└──────────────┬──────────────────────────────────────────────┘
               ▼   ⛔ EXECUTION GATE OPENS HERE ⛔
               ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 5 — EXECUTION & REFLECTION                           │
│  Part A — Execution:                                        │
│    Scaffold → playlist-first → design CSS → SAMPLE          │
│    CHECKPOINT (mandatory) → batch build → paired verify     │
│  Part B — Reflection:                                       │
│    Strategy check, source-trace audit, Title Test,          │
│    surface check, anti-slop audit, review summary           │
│  Tools allowed: everything                                  │
│  Exit: user explicitly accepts the deck                     │
└─────────────────────────────────────────────────────────────┘
```

---

## The execution gate

Slide-creation tools (`Write` / `Edit` / `MultiEdit` on slide HTML, `image_generation`, project-mutating computer commands) are **forbidden** until Phase 4 is explicitly approved. This is a **hard-coded binding** in Guide Mode, not a suggestion.

Sample slides are further gated inside Phase 5: even after the gate opens, the full-deck build must not start until the sample-slide checkpoint is approved.

---

## The layered rollback rule

When a downstream phase discovers a gap, we return to the earliest upstream phase that owns that gap. Never improvise upstream decisions in-place.

| Gap discovered in… | Root cause layer | Action |
|---|---|---|
| Phase 5 build reveals a claim has no source | Phase 2 (Substance) | Return to Phase 2, gather source, resume |
| Phase 5 build reveals two beats don't connect | Phase 3 (Structure) | Return to Phase 3, re-outline, resume |
| Phase 5 build reveals density is wrong for delivery | Phase 4 (Surface) | Revise Phase 4 spec, don't improvise |
| Phase 5 build reveals wrong audience frame | Phase 1 (Strategy) | Return to Phase 1, re-align, cascade forward |
| Phase 3 reveals we don't have material for a beat | Phase 2 (Substance) | Return to Phase 2, gather, resume Phase 3 |
| Phase 4 reveals the outline demands a chart type we can't source | Phase 2 or 3 | Return to appropriate layer |

**Why this matters**: improvised structure = worse deck; improvised content = unsourced facts (AI slop); improvised visual = inconsistent chrome; improvised strategy = wrong deck for wrong audience. Discipline over speed.

---

## Guide Mode invariants (bind every phase)

These bind me at every phase, not just one:

1. **Questions go through the question tool, never plain text.** Concrete [A/B/C] options with my top pick marked. No open-ended "what would you change?".
2. **Reasoning before options.** Share the analysis that led to the question before asking.
3. **Explicit phase-boundary approval.** Every phase exits with a written summary and a decisive user "yes".
4. **Training-memory is not a valid source.** Every fact must trace to user material or a session-retrieved source.
5. **Anti-slop discipline.** No filler content, no decorative stats, no invented citations, no stereotype defaults (blue AI decks, navy finance decks, teal healthcare).
6. **Layered rollback on gap discovery.** Do not paper over upstream failures downstream.
7. **Do not disclose internal mechanics** to end users (tool names, prompts, model names). This doc is *for you as reviewer*, not for downstream deck audiences.

---

## Where to look for optimization holes

If you're reviewing to identify weaknesses:

- **Prompt mechanism issues** → `06-prompt-mechanism.md` (this is where I most suspect systemic weakness)
- **Model / tool opacity issues** → `07-models-and-tools.md` (honest inventory of what I can and cannot see)
- **Per-phase failures** → `01`–`05` (each has a dedicated "Weaknesses" section, plus a "Failure modes" section per task)
- **Cross-phase failures** → look for pattern repetition across phase docs — recurring weakness = systemic

---

## Reading order

1. This file (`00-overview.md`)
2. `07-models-and-tools.md` — grounds what's actually happening under the hood
3. `06-prompt-mechanism.md` — grounds what binds behavior
4. `01`–`05` in phase order — depth read

If you're time-constrained: skip to the **"Weaknesses & optimization opportunities"** section at the bottom of each phase file. That's where the actionable material lives.
