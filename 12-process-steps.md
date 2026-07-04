# 12 — Master Process Steps (Linear Walkthrough)

The complete end-to-end sequence, top to bottom, as it would run for a typical deck. Cross-references to detailed docs where each step is documented.

Notation:
- **STEP N** — sequential steps
- `[Tool: X]` — tool invoked
- `[Artifact: X]` — file produced in Project
- `[Gate]` — user approval required; turn ends
- `→` — next step

---

## Preamble — before any deck work

### STEP 0.1 — Load Guide Mode playbook (first turn only)

`[Tool: load_mode_prompt(["guide"])]`

Loads the consultative playbook that binds my behavior. Details: `00-overview.md`.

### STEP 0.2 — Assemble turn context

Automatic; not a tool call. I have:
- Base system prompt
- Guide Mode overlay
- User's message
- Chat history (if any)
- Available skills catalog
- Attached files list

---

## Phase 1 — Strategy

Full detail: `01-phase1-strategy.md`. Pseudocode: `09-code-logic.md § Phase 1`.

### STEP 1.1 — Scenario classification (silent)

Classify user input as scenario A/B/C/D/E based on how much framing is already given.

- A: vague topic only
- B: topic + partial context
- C: materials attached, no framing
- D: recreate/replicate existing deck
- E: fully specified brief

If Scenario D → collapse Phase 1 to a single scope-confirmation question → skip to Phase 5.

### STEP 1.2 — Share reasoning, ask about dimensions

For each of the 5 dimensions still unclear:
1. Share ≥1 paragraph or 3-bullet analysis of what I understand so far
2. `[Tool: unified_ask_user_question]` with concrete [A/B/C] options, top pick marked

Dimensions:
- Audience (with cognition, stance, authority)
- Purpose (with behavior change, success metric)
- Delivery (with live/async, duration, setting)
- Constraints (with sensitivities, avoid list)
- Success definition

Enforce depth rules:
- Never accept "inform" as final purpose
- Force live-vs-async binary
- Always ask success metric

**[Gate: turn ends after each question]**

### STEP 1.3 — Consolidate Strategy Summary

`[Tool: Write .guide/strategy-summary.md]`

`[Artifact: .guide/strategy-summary.md]`

Structured block with all 5 dimensions.

### STEP 1.4 — Phase 1 exit gate

`[Tool: unified_ask_user_question — "Approve Strategy Summary?"]`

**[Gate]**

→ Proceed to Phase 2 on approval; otherwise loop back.

---

## Phase 2 — Substance

Full detail: `02-phase2-substance.md`.

### STEP 2.1 — Load prior artifact

`[Tool: Read .guide/strategy-summary.md]`

### STEP 2.2 — Inventory user materials

For each attached file:
- PPTX → `[Tool: import_pptx]` → `_import/` folder with per-slide JSON + media + preview PNGs
- PDF → `[Tool: import_pdf]` → per-page structured data
- MD/TXT/DOCX → `[Tool: Read]`
- Image → `[Tool: Read]` with vision
- Link → `[Tool: crawler]`

Produce 2–3 line summary per file. If any file >5 pages, show summary to user for correction.

`[Artifact: .guide/inventory.md]`

### STEP 2.3 — Gap list

Compute delta between Strategy Summary needs and user materials.

`[Artifact: .guide/gap-list.md]`

`[Tool: unified_ask_user_question — "Approve research scope OR provide more materials"]`

**[Gate]**

### STEP 2.4 — Research questions (if research allowed)

Draft 3–5 specific questions (not "research topic X" — "what is 2025 US market size per Gartner").

`[Tool: unified_ask_user_question — "Approve research questions"]`

**[Gate]**

### STEP 2.5 — Dispatch research sub-agent

`[Tool: create_agent(role=research, share_slides_project=true)]`

Instructions include:
- Specific questions
- Output file path: `research/<topic>.md`
- Format: fact + URL + date + confidence tier
- Cross-check rule: ≥2 sources for quantitative
- Source tier preference: primary > secondary > tertiary
- No training memory

Sub-agent runs asynchronously, writes brief file, returns 1-line status.

### STEP 2.6 — Read and quality-check brief

`[Tool: Read research/<topic>.md]`

- Spot-check 2–3 facts against source URLs
- Flag stale facts (>12mo)
- Verify cross-check on quantitative claims

If quality low → re-dispatch with sharper instructions.

### STEP 2.7 — Extract Core Message

Generate 2–3 candidates with claim structure (subject + verb + specific outcome).

`[Tool: unified_ask_user_question — "Pick Core Message"]`

**[Gate]**

`[Artifact: .guide/core-message.md]`

### STEP 2.8 — Build source map

For each projected slide (based on target length), identify backing source.

`[Artifact: .guide/source-map.md]` — real Markdown table

### STEP 2.9 — Sufficiency check

If any row has blank source:
- Gather more material (research or user upload) — loop back
- Reduce deck length
- Restructure blanks as sub-points

### STEP 2.10 — Phase 2 exit gate

`[Tool: unified_ask_user_question — "Approve: materials sufficient, Core Message locked, source map complete"]`

**[Gate]**

→ Proceed to Phase 3.

---

## Phase 3 — Structure

Full detail: `03-phase3-structure.md`.

### STEP 3.1 — Load prior artifacts (parallel)

`[Tool: PARALLEL(Read strategy-summary, Read core-message, Read source-map, Read research brief)]`

### STEP 3.2 — Length recommendation

`[Tool: unified_ask_user_question — "Length: Executive / Comprehensive / Deep-dive"]`

**[Gate]**

### STEP 3.3 — Framework selection

Generate 2–3 candidate outlines in plain language. Identify framework AFTER outline is drafted (users evaluate concrete outlines, not framework names).

`[Tool: unified_ask_user_question — "Outline direction (plain language + framework name in parens)"]`

**[Gate]**

Rejected outlines → kill list.

### STEP 3.4 — Opening design

Generate 2–3 opening approaches (cold / warm / story / question / number).

`[Tool: unified_ask_user_question]`

**[Gate — opening reviewed BEFORE middle]**

### STEP 3.5 — Core argument (beat-by-beat)

For each beat:
- Claim + evidence + placement rationale
- Verify claim has source in map
- If missing → ROLLBACK to Phase 2

### STEP 3.6 — Core beats review

`[Tool: unified_ask_user_question — "Approve core beats"]`

**[Gate]**

If concerns: diagnose first ("sounds like Beat 3 doesn't follow — is that it?"), THEN offer [A/B/C] fixes. Never open-ended.

### STEP 3.7 — Closing design

Generate closing options (call-to-action / summary / vision / question / circle-back).

`[Tool: unified_ask_user_question]`

**[Gate]**

### STEP 3.8 — Case selection (per case slide)

For each slide needing case/illustration: generate ≥2 alternatives.

`[Tool: unified_ask_user_question per case]`

If can't think of alternatives → source map thin → ROLLBACK to Phase 2.

### STEP 3.9 — Chart decisions (per chart slide)

Type + framing + emphasis LOCKED in Phase 3 (not deferred to Phase 5).

`[Tool: unified_ask_user_question per high-stakes chart]`

### STEP 3.10 — Page allocation

SEPARATE round from outline review.

`[Tool: unified_ask_user_question — "Approve allocation OR rebalance"]`

**[Gate]**

### STEP 3.11 — Final outline consolidation

Draft real titles (not "Section 1"). Consolidate everything.

`[Artifact: .guide/outline-final.md]`
`[Artifact: .guide/kill-list.md]`

### STEP 3.12 — Sealed-outline sanity checks

- Title Test passes
- Every slide traces to Core Message
- Every claim has source
- Every section earns its place

### STEP 3.13 — Phase 3 exit gate

`[Tool: unified_ask_user_question — "Approve FINAL outline (SEALED after approval)"]`

**[Gate]**

→ Proceed to Phase 4.

---

## Phase 4 — Surface

Full detail: `04-phase4-surface.md`.

### STEP 4.1 — Load prior artifacts

`[Tool: PARALLEL(Read outline-final, Read strategy-summary)]`

### STEP 4.2 — Brand asset collection (FIRST — per optimization)

If user mentioned brand template but didn't upload → pause and ask.

Collect: logos, brand colors (hex), fonts (with fallback), photography style, iconography, chrome elements.

### STEP 4.3 — Density decision

`[Tool: unified_ask_user_question — "Presentation / Read-only / Hybrid (with per-section split allowed)"]`

**[Gate]**

Recommendation based on delivery context from Strategy Summary.

### STEP 4.4 — Visual reference source

Proactively check:
1. User uploaded template?
2. Personal skill match?
3. Public skill match?

Present as [A/B/C/D] with concrete names, not generic labels.

If [D] (from scratch): name topic stereotype and counter-propose.

`[Tool: unified_ask_user_question]`

**[Gate]**

If [B]: `[Tool: load_skill]`

### STEP 4.5 — Type system

Numeric scale (explicit pt values). Fallback stack mandatory. Blacklist check (no Hiragino Kaku Gothic ProN).

### STEP 4.6 — Palette

Contrast-check every text-on-background combination (≥4.5:1 body, ≥3:1 large).
Semantic colors color-blind-safer default (blue/orange vs. green/red).

### STEP 4.7 — Layout system

Name each recurring layout (cover / section divider / standard / data / closing).
Chrome spec as single artifact — logo/page-number/footer placement, exceptions listed.

### STEP 4.8 — Iconography + motion + photography decisions

Explicit choices, not deferred to Phase 5 drift.

### STEP 4.9 — Design Summary

`[Artifact: .guide/design-summary.md]`
`[Artifact: .guide/missing-assets.md]`

### STEP 4.10 — Phase 4 exit gate

`[Tool: unified_ask_user_question — "Approve Design Summary — execution gate opens after"]`

**[Gate]**

═════════════════════════════════════════
**EXECUTION GATE OPENS**
Slide-creation tools now allowed.
═════════════════════════════════════════

---

## Phase 5 Part A — Execution

Full detail: `05-phase5-execution-reflection.md`.

### STEP 5A.1 — Load all upstream artifacts (parallel)

`[Tool: PARALLEL(Read strategy-summary, core-message, source-map, outline-final, design-summary, missing-assets)]`

### STEP 5A.2 — Project scaffolding

`[Tool: Write <deck>.slides/manifest.json]` with empty playlist.

### STEP 5A.3 — Playlist-first

Fill `playlist` array with all intended filenames BEFORE writing bodies.

`[Tool: Edit manifest.json — add playlist]`

Preview now shows skeleton placeholders for each planned slide.

### STEP 5A.4 — Design system files

`[Tool: Write <deck>.slides/assets/chrome.css]` with CSS variables (type scale, palette).

`[Tool: Copy brand assets → assets/]`

If images need resize:
- `[Tool: computer_fetch_url]`
- `[Tool: computer_run_command — PIL resize]`
- `[Tool: save_computer_file_to_project]`

### STEP 5A.5 — Sample slides (MANDATORY CHECKPOINT)

Build 3 slides: cover + 1 content layout + 1 data layout (if deck has data).

`[Tool: PARALLEL(Write cover, Write sample-content, Write sample-data)]`

Verify:
`[Tool: PARALLEL(check_slide_layout, capture_slide_screenshot)]`

Fix real bugs.

Present to user:
`[Tool: unified_ask_user_question — "Approve sample slides"]`

**[Gate — MANDATORY, non-skippable]**

If rejected: revise visual approach, re-sample. Outline is sealed — don't rewrite structure.

### STEP 5A.6 — Batch authoring

For each batch of 5–8 slides:
1. `[Tool: PARALLEL(Write slide-N × batch-size)]` — parallel writes
2. Verify:
   `[Tool: PARALLEL(check_slide_layout batch, capture_slide_screenshot batch)]`
3. Read BOTH outputs together
4. Fix only confirmed real bugs (not intentional decorative overlays)
5. Re-verify

Per-slide authoring:
- Look up outline entry → Draft title, role, content type
- Look up design → density, layout, chrome
- Look up source map → backing source (paste data verbatim)
- Write HTML enforcing editor contract:
  - Absolute positioning
  - Flat `data-object` structure
  - No `overflow:auto` anywhere
  - Real `<table>` for tables

### STEP 5A.7 — Manifest / filesystem consistency check

At Part A exit: `[Tool: LS <deck>.slides/slides/]` — verify playlist matches file set.

---

## Phase 5 Part B — Reflection

### STEP 5B.1 — Load context for review

`[Tool: PARALLEL(Read strategy, core-message, source-map, design-summary)]`

Full deck screenshots:
`[Tool: capture_slide_screenshot mode=batch_slides]`

### STEP 5B.2 — Strategy check

For each slide: does it serve confirmed audience + purpose? Supports Core Message?

Flag issues.

### STEP 5B.3 — Substance / source-traceability audit

Extract every fact from deck (numbers, dates, names, quotes, claims).
For each: trace to source map or research brief.
Anything unsourced → delete or replace.

### STEP 5B.4 — Title Test

Extract all titles. Read in sequence. Do they alone tell a coherent story?

If not: rewrite titles to claim-shape.

### STEP 5B.5 — Surface check

For each slide: squint test (reduced screenshot), consistency with Design Summary, readability for delivery context.

### STEP 5B.6 — Anti-slop audit

Run explicit checklist:
- Filler content
- Decorative unsourced stats
- Unnecessary emoji
- Gradient backgrounds not from brand
- Rounded-corner + left-border containers (AI-slop tell)
- Generic stock imagery
- Made-up citations

### STEP 5B.7 — Review summary

Group issues by layer (Strategy / Substance / Structure / Surface / Anti-slop).

Present per-issue:
`[Tool: unified_ask_user_question — per-issue Yes/No or A/B/C]`

**[Gate]**

Apply approved fixes:
`[Tool: Edit / MultiEdit]`

Re-verify affected slides. If fix touched shared assets (chrome.css, palette), re-verify whole deck.

### STEP 5B.8 — Data-verify sub-agent (for high-stakes decks)

If audience type ∈ {board, investor, medical, legal, regulatory}:

Offer:
`[Tool: unified_ask_user_question — "Run data-accuracy verification against primary sources?"]`

If yes:
`[Tool: create_agent(role=data_verify, share_slides_project=true)]`

Sub-agent writes verdict:
`[Artifact: review/<deck>.md]`

For each FIX item:
`[Tool: Edit]`

Dispatch FRESH sub-agent, iterate until clean.

### STEP 5B.9 — Handoff document

`[Artifact: <deck>.slides/HANDOFF.md]`

Summarizes: Strategy, Core Message, sources, Design Summary, applied fixes, known limitations, file paths.

### STEP 5B.10 — Final acceptance

`[Tool: unified_ask_user_question — "Accept the deck"]`

**[Gate]**

→ Deck complete.

---

## Post-handoff iterations

### Small edits (in-editor by user)

User edits directly in the preview editor. No involvement from me.

### User asks for changes

1. `[Tool: Read affected slide files]` — refresh my mental model (files may have changed)
2. Apply changes
3. Re-verify affected slides
4. If change affects Strategy/Structure — consider whether to trigger rollback to earlier phase

### Full duplicate / save-as (new project)

`[Tool: create_agent(role=copy)]`

Copy sub-agent forks source deck byte-for-byte into new project. Never rebuild manually.

### Save as skill

`[Tool: save_skill(from_project_dir=<deck>.slides/, ...)]`

Publishes deck as reusable template for future engagements.

### Export

`[Tool: export_slides(export_format=pptx|pdf, ...)]`

Renders actual slides (not code rebuild).

---

## Rollback triggers (any phase)

| Discovered gap | Trigger | Action |
|---|---|---|
| Unsourced fact needed | Phase 3, 5A, or 5B | ROLLBACK to Phase 2 |
| Structural incoherence | Phase 5A or 5B | ROLLBACK to Phase 3 |
| Visual mismatch | Phase 5A | Revise Phase 4 spec, don't improvise |
| Wrong audience frame | Any phase | ROLLBACK to Phase 1 (rare, expensive) |
| Manifest/filesystem drift | Any turn touching deck | Reconcile per manifest-consistency rule |

---

## The complete flow at a glance

```
User message
    ▼
STEP 0: Load Guide Mode + assemble context
    ▼
STEP 1.1-1.4: Phase 1 Strategy      → strategy-summary.md   [GATE]
    ▼
STEP 2.1-2.10: Phase 2 Substance    → source-map.md         [GATE]
                                       core-message.md
                                       research/<topic>.md (if research)
    ▼
STEP 3.1-3.13: Phase 3 Structure    → outline-final.md      [GATE]
                                       kill-list.md
    ▼
STEP 4.1-4.10: Phase 4 Surface      → design-summary.md     [GATE]
                                       missing-assets.md
════════════════════════════════════════════════════════
                EXECUTION GATE OPENS
════════════════════════════════════════════════════════
    ▼
STEP 5A.1-5A.5: Scaffold + samples  → manifest.json         [SAMPLE GATE]
                                       assets/**
                                       slides/cover.html
                                       slides/sample*.html
    ▼
STEP 5A.6-5A.7: Batch build         → slides/*.html (all)
                                       verified geometrically + visually
    ▼
STEP 5B.1-5B.9: Reflection          → fixes applied         [GATE per issue]
                                       review/<deck>.md (if verify)
                                       HANDOFF.md
    ▼
STEP 5B.10: Final acceptance                                [FINAL GATE]
    ▼
Deck complete → optional export / save-as-skill / iterations
```

Every arrow can loop back to any earlier phase if a gap is discovered.

Every `[GATE]` blocks until user responds.

Every artifact is a real file in the Project store — persistent, versioned, inspectable at any time.
