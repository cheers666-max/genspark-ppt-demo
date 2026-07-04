# 11 — Execution Context: What State Exists at Each Step

This document maps out **what artifacts exist in the Project at each point** in the engagement, and **what context I load** to make decisions at that point.

Useful for understanding:
- Where state lives at any moment
- What can be inspected between turns
- How context is reconstructed after long conversations

---

## The artifact map

By the end of each phase, these files exist in the Project:

```
Project root/
│
├─ [pre-Phase 1: only user-attached files]
│
├─ .guide/                                     ← created during Phase 1
│   └─ strategy-summary.md                     ← Phase 1 exit artifact
│
├─ .guide/                                     ← accumulates during Phase 2
│   ├─ strategy-summary.md
│   ├─ inventory.md                            ← Phase 2 Task 1
│   ├─ gap-list.md                             ← Phase 2 Task 2
│   ├─ core-message.md                         ← Phase 2 Task 7
│   └─ source-map.md                           ← Phase 2 exit artifact
│
├─ research/                                   ← if Phase 2 dispatched research
│   └─ <topic>.md                              ← sub-agent output
│
├─ _import/                                    ← if user attached PPTX/PDF
│   ├─ manifest.json
│   ├─ slides/slide_NNN.json                   ← per-slide structured
│   ├─ media/**                                ← extracted images
│   └─ preview/slide_NNN.png                   ← visual ground truth
│
├─ .guide/                                     ← accumulates during Phase 3
│   ├─ [all Phase 1-2 files]
│   ├─ outline-draft-1.md                      ← Phase 3 iterations
│   ├─ outline-draft-2.md
│   ├─ outline-final.md                        ← Phase 3 exit artifact
│   └─ kill-list.md                            ← rejected alternatives
│
├─ .guide/                                     ← accumulates during Phase 4
│   ├─ [all Phase 1-3 files]
│   ├─ design-summary.md                       ← Phase 4 exit artifact
│   └─ missing-assets.md                       ← flagged for user
│
├─ .skills/                                    ← if Phase 4 loaded a skill
│   └─ <skill-name>/**
│
├─ <deck-name>.slides/                         ← created in Phase 5 Part A
│   ├─ manifest.json                           ← playlist first
│   ├─ slides/
│   │   ├─ cover.html                          ← after sample checkpoint
│   │   ├─ agenda.html
│   │   └─ ...                                 ← after batch authoring
│   └─ assets/
│       ├─ chrome.css                          ← design system CSS
│       ├─ colors.css                          ← palette variables
│       ├─ logo.png                            ← from user brand assets
│       ├─ fonts/**
│       └─ images/**                           ← resized as needed
│
├─ review/                                     ← if data-verify sub-agent run
│   └─ <deck-name>.md                          ← PASS/FIX verdict
│
└─ <deck-name>.slides/
    └─ HANDOFF.md                              ← Phase 5 exit artifact

process-docs/                                  ← this documentation
├─ 00-overview.md
├─ 01-phase1-strategy.md
├─ 02-phase2-substance.md
├─ 03-phase3-structure.md
├─ 04-phase4-surface.md
├─ 05-phase5-execution-reflection.md
├─ 06-prompt-mechanism.md
├─ 07-models-and-tools.md
├─ 08-architecture.md
├─ 09-code-logic.md
├─ 10-tool-reference.md
├─ 11-execution-context.md
└─ 12-process-steps.md
```

---

## Per-phase context load

At each phase start, I re-read the artifacts I need. This is important because chat context can go stale over long builds — but files in the Project are the source of truth.

### Phase 1 entry

**Load**:
- User's opening message (from chat)
- Attached files (referenced lightly — deep read is Phase 2)

**Produce**:
- Internal scenario classification
- `.guide/strategy-summary.md`

### Phase 2 entry

**Load**:
- `.guide/strategy-summary.md`
- Full read of all attached files
- Chat history of Phase 1 (for context)

**Produce**:
- `.guide/inventory.md`
- `.guide/gap-list.md`
- `research/<topic>.md` (if research)
- `.guide/core-message.md`
- `.guide/source-map.md`

### Phase 3 entry

**Load**:
- `.guide/strategy-summary.md`
- `.guide/core-message.md`
- `.guide/source-map.md`
- `research/<topic>.md` (if exists)

**Produce**:
- `.guide/outline-draft-N.md` (iterations)
- `.guide/outline-final.md`
- `.guide/kill-list.md`

### Phase 4 entry

**Load**:
- `.guide/outline-final.md`
- `.guide/strategy-summary.md` (for delivery context → density decision)
- User's brand-asset uploads (if any)
- Skill catalog listing (from context)

**Produce**:
- `.guide/design-summary.md`
- `.guide/missing-assets.md`
- `.skills/<skill>/**` (if source B chosen)

### Phase 5 Part A entry

**Load** (parallel Read):
- `.guide/strategy-summary.md`
- `.guide/core-message.md`
- `.guide/source-map.md`
- `.guide/outline-final.md`
- `.guide/design-summary.md`
- `.guide/missing-assets.md`
- Skill contents if source B

**Produce**:
- `<deck>.slides/manifest.json`
- `<deck>.slides/assets/chrome.css` + palette + fonts + brand assets copied
- `<deck>.slides/slides/*.html` (sample + full batches)

### Phase 5 Part B entry

**Load**:
- All Phase 5A outputs
- `.guide/strategy-summary.md` (for Strategy check)
- `.guide/source-map.md` (for source-traceability audit)
- `.guide/design-summary.md` (for Surface consistency check)

**Produce**:
- Fix edits applied to deck files
- `review/<deck>.md` (if data-verify sub-agent run)
- `<deck>.slides/HANDOFF.md`

---

## Sample artifact contents

### `.guide/strategy-summary.md` (Phase 1 exit)

```markdown
# Strategy Summary

## Scenario
B (topic + partial context)

## Audience
- **Primary**: Board of Directors (7 members)
- **Cognition**: MBA-level financial literacy, familiar with our sector
- **Prior exposure**: Received Q3 memo 2 weeks ago
- **Stance**: Concerned about margin compression
- **Authority**: Deciding on FY26 budget approval

## Purpose
- **Category**: Persuade + Decide
- **Behavior change**: Approve FY26 growth budget as proposed (not cut 20%)
- **Success metric**: Vote taken at meeting, budget approved without cuts

## Delivery
- Live meeting, 20 minutes presentation + 10 min Q&A
- Boardroom (large screen, ~15ft viewing distance)
- Deck emailed as PDF 24 hours before

## Constraints
- Hard duration: 20 min presentation
- Sensitivity: don't mention Q2 miss unless directly asked
- Compliance: none

## Outcome
Board member overheard in hallway: "The plan is defensible; the growth investment thesis holds."
```

### `.guide/source-map.md` (Phase 2 exit)

```markdown
# Source Map (draft, will finalize at outline)

| #  | Projected content                     | Source                              |
|----|---------------------------------------|-------------------------------------|
| 1  | Cover — Q3 Board Review               | Brand assets                        |
| 2  | Opening: Where we said we'd be        | Q3 memo (user) p.2                  |
| 3  | Agenda                                | Derived                             |
| 4  | Market context — segment growth       | Research brief §1                   |
| 5  | Our Q3 vs. plan                       | Q3 memo (user) p.5-7                |
| 6  | Revenue chart                         | Q3 memo p.5 (raw data)              |
| 7  | Margin trajectory                     | Q3 memo p.9                         |
| 8  | Case study — Beta transition           | Research brief §3                   |
| 9  | Why now: cost of delay chart          | Research brief §5 + Q3 memo p.11    |
| 10 | Investment thesis restated            | FY26 budget proposal (user) p.3     |
| 11 | Ask: approve FY26 budget              | FY26 budget proposal p.14           |
| 12 | Close: circle back to opening         | Derived                             |
```

### `.guide/outline-final.md` (Phase 3 exit)

```markdown
# Final Outline (SEALED)

Framework: SCQA opening + Pyramid core + Vision closing
Length: 12 slides
Core Message: "The FY26 investment thesis holds — Q3 confirms it; the case for delay is more costly than the case for the ask."

## Slide-by-slide

1. **Cover** — "Q3 Board Review · FY26 Path Forward"
   [chrome only]

2. **Where we said we'd be, Q3 2025** — set expectations
   [narrative] Source: Q3 memo p.2

3. **Today** — agenda
   [nav]

4. **The segment shifted in Q3** — Situation
   [claim + chart] Source: Research brief §1

5. **Our Q3 outperformed plan on the metrics that matter** — Answer preview
   [claim + big numbers] Source: Q3 memo p.5-7

6. **Growth: 24% vs. plan of 18%** — Evidence
   [data chart: quarterly bars + YoY line] Source: Q3 memo p.5

7. **Margin: temporary compression, on plan** — Complication
   [data chart + explanation] Source: Q3 memo p.9

8. **Case: how Beta navigated the same transition** — Analogous evidence
   [case study] Source: Research brief §3

9. **The cost of delaying is higher than the cost of investing** — Argument
   [chart: cost comparison] Source: brief §5 + memo p.11

10. **What we need for FY26** — Ask
    [claim + bullet breakdown] Source: FY26 proposal p.14

11. **What you get by approving** — Vision
    [claim + expected outcome]

12. **Where we'll be Q3 next year** — Close (circle-back to slide 2)
    [narrative]
```

### `.guide/design-summary.md` (Phase 4 exit)

```markdown
# Design Summary

## Density
Hybrid — sections 1-3 (opening) and 11-12 (closing) presentation-style;
sections 4-10 (core evidence) read-only-lean for post-meeting review.

## Visual source
B — skill `financial-board-deck-v2`
Rejected: A (no user template provided), D (skill has better editorial fidelity)

## Type system
- Display: Söhne Buch (fallback: Söhne, "Helvetica Neue", sans-serif)
- Body: Söhne Buch (same face, different weight/size)
- Fallback stack: `Söhne, "Helvetica Neue", Arial, sans-serif`
- Scale:
  - Title: 44pt
  - Section: 32pt
  - Body: 18pt
  - Caption: 14pt
  - Footnote: 11pt

## Palette
- Primary:   #1B2951 (deep navy — from brand)
- Accent:    #C4A264 (muted gold — from brand)
- Neutrals:  #0F1729, #4A5568, #A0AEC0, #E2E8F0, #F7FAFC
- Semantic:  positive #2C7A7B (teal), negative #C05621 (rust)
             — color-blind safer than green/red
- Background: #FFFFFF
- Contrast:  All body text ≥7.2:1 verified

## Layouts
- Cover:            Centered title + subtitle + brand mark corner
- Section divider:  Large section number + section label, generous whitespace
- Standard content: Title top-left, 1-column body, chart or callout right
- Data slide:       Title top, big chart 60% area, caption bottom
- Closing:          Mirror cover with year forward

## Chrome
- Logo:         top-left 40x40, all slides except cover
- Page number:  bottom-right, 11pt muted, all slides except cover
- Footer:       "Confidential — Board" bottom-left, 11pt muted
- Divider rule: 1px #E2E8F0 under title, standard content only

## Iconography
Line icons (skill provides Feather-style set)

## Motion
None

## Missing assets
- FY26 CFO headshot (slide 11 — placeholder text lockup)
```

### `<deck>.slides/HANDOFF.md` (Phase 5 exit)

```markdown
# Q3 Board Review — Handoff

Delivered: 2026-07-03

## Strategy summary
Board deck for FY26 budget approval. Persuasion-first; audience is
skeptical about margin, favorable on growth. 20-min presentation +
Q&A.

## Core message
The FY26 investment thesis holds — Q3 confirms it; the case for
delay is more costly than the case for the ask.

## Sources used
- User: Q3 memo (Nov 2025), FY26 budget proposal (Dec 2025)
- Research brief: research/segment-growth-2026.md
- Verified against primary sources (data-verify sub-agent, verdict clean)

## Design summary
Hybrid density, skill "financial-board-deck-v2", navy + muted gold
palette, color-blind-safer semantic colors, Söhne typeface.

## Review fixes applied
- Slide 4: reframed segment shift as opportunity, not risk (Strategy check)
- Slide 7: added footnote clarifying margin definition (Substance)
- Slides 6, 9: standardized chart caption placement bottom-left (Surface)

## Known limitations
- CFO headshot on slide 11 uses text lockup — replace with photo when available

## Files
- Deck: q3-board-review.slides/
- Research brief: research/segment-growth-2026.md
- Data-verify verdict: review/q3-board-review.md (all PASS)
```

---

## Context reconstruction after long conversations

Chat context can decay over long builds. Recovery pattern:

1. **Re-read all `.guide/*.md`** at any drift-risk point
2. **Re-read the current phase's exit artifact** before making decisions
3. **Re-read the most recent slide files** before editing them (files may have been changed since I last read them — by user in the editor, by earlier tool calls I don't remember, etc.)

This is why the `.guide/` folder is important: it's my externalized long-term memory.

---

## The single principle

> **Persistent state lives in the Project store. Anything not written there is ephemeral and will be lost.**

Every important decision, artifact, or intermediate step goes into a file. Chat context is convenient but not authoritative.
