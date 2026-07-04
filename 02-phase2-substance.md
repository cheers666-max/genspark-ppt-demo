# 02 — Phase 2: Substance ("What to Use")

## Purpose

Gather, verify, and organize all raw material that will appear on the deck — with a traceable source for every fact — and confirm material is sufficient to fill target length without padding.

## Guiding principle

**Training memory is NOT a valid source.** Every number, date, name, quote, chart datum, or specific claim on every slide must trace to either (a) user-provided material or (b) something retrieved this session. If we can't source it, we don't say it.

## Duration

2–4 rounds. Longer when research is opted in (research sub-agent adds an async waiting step).

---

## Inputs consumed

- **Strategy Summary** (from Phase 1) — filters what content is worth including
- **Scenario classification** — Scenario D (replication) mostly skips this phase
- **Attached user materials** — PPTX, PDF, DOCX, images, links
- **User's Phase 1 answer on content-source dimension** — user-only / research-allowed / hybrid

## Outputs produced

- **Material inventory** — per-file summary of what user provided
- **Gap list** — what's needed that isn't in user materials
- **Research brief file** (if research done) — persistent, sourced
- **Core Message** — one sentence, user-approved
- **Per-slide source map** — table backing every projected slide
- **Confirmed length** — adjusted if material doesn't support original ask

## Gate criteria (all must pass to exit)

1. Sufficiency: every row in source map has a non-blank source
2. Core Message locked: user explicitly confirms the one-sentence claim
3. Source traceability audit passes: every intended fact traces to an artifact
4. User approval on all three

---

## Task 1 — Inventory user materials

### Sub-tasks

1. Read every attached file end-to-end (not skim)
2. For each file, produce a 2–3 line "read summary" showing what's actually inside
3. Note contradictions between files if any
4. Note gaps between user materials and what Strategy Summary implies is needed

### Tool binding

| File type | Tool | Notes |
|---|---|---|
| PPTX | `import_pptx` | Structured — preserves layout, text, style; produces per-slide JSON + media + preview PNGs |
| PDF | `import_pdf` | Per-page text spans + image placements + page screenshots |
| DOCX / MD / TXT | `Read` | Direct read |
| Images | `Read` (with crop_left/top/right/bottom for fine print zoom) | Vision |
| Links user pasted | `crawler` | Markdown extraction |
| Long PDFs (>50pp) | `summarize_large_document` | Question-driven extraction |

### Prompt rules

- **Full-read is enforced.** Skimming produces false gaps (research the topic even though user's PRD covers it) or false confidence (miss a contradiction).
- **PPTX ALWAYS uses `import_pptx`.** Never unzip and parse XML by hand — layout/text/style resolution isn't reproducible manually.
- **Show read summary to user** if any file is >5 pages. Lets user correct if I misread.

### Failure modes

- Skimming a 40-page PRD → miss coverage → redundant research
- Treating filename as content signal
- Missing internal contradictions across multiple attached files
- Reading only the first pages of a long PDF

---

## Task 2 — Gap list

### Definition

The delta between (a) content the deck needs per Strategy Summary and (b) content the user materials cover.

### Format

```
COVERED BY USER MATERIALS:
  - Q3 revenue numbers (PRD p.12)
  - Product roadmap (PRD p.28-31)
  - Team headcount (PRD p.5)

GAPS (need to fill):
  - Market size for AI-in-healthcare segment (2025 figures)
  - Competitive positioning (top 3 competitors' recent moves)
  - Regulatory landscape (any changes in past 12 months)
```

### Prompt rules

- **Write the gap list explicitly as an artifact**, don't keep it in my head.
- **Show gap list to user before dispatching research.** Two things happen: (1) user may reveal they have material for gaps ("actually, we have a competitive brief — let me upload"), (2) user may reveal gaps aren't worth researching ("skip regulatory, not relevant this quarter").

### Failure modes

- Implicit gap list → redundant research on covered topics
- Not showing user → wasted research rounds
- Treating everything as a gap ("research the whole topic") → shallow brief

---

## Task 3 — Content-source branching decision

Based on Phase 1's content-source dimension:

| Branch | Trigger | Action |
|---|---|---|
| **B1 — User-only** | User restricted to their own materials | Do NOT research. If gaps exist → ask user for more OR shorten deck. |
| **B2 — Research allowed** (default) | User opted in, or default | Dispatch research sub-agent with specific gap-filling questions. |
| **B3 — Hybrid** | Some material + some research needed | B2, but scoped to gaps only — don't re-research what materials cover. |

### Prompt rules

- **Default is B2** (research allowed) unless user explicitly restricted.
- **Never do B1 by assumption** — verify with user if content-source dimension wasn't clearly answered in Phase 1.

---

## Task 4 — Research questions (if B2 or B3)

### Present research questions for user approval BEFORE dispatching

Format:

```
PROPOSED RESEARCH QUESTIONS:
  1. What is the 2025 US AI-in-healthcare market size in USD,
     per Gartner or IDC or similar analyst reports?
  2. What are the top 3 competitors' recent moves (last 12 months)
     in [segment]?
  3. What primary evidence exists for [specific claim]?

Approve? [Yes / adjust]
```

### Prompt rules

- **Questions must be specific and answerable in a single retrieval.**
  - ❌ "Research the AI healthcare market"
  - ✅ "What is the 2025 US AI-in-healthcare market size in USD, per Gartner or IDC or similar analyst reports?"
- **3–5 questions per research round.** More = shallow brief.
- **Get explicit user approval on the questions** before dispatch.

### Failure modes

- Vague questions produce vague briefs
- Too many questions (>7) → sub-agent produces shallow coverage across all
- Not showing questions to user → user discovers research covered the wrong angle after 5 minutes of wait

---

## Task 5 — Research sub-agent dispatch (if B2 or B3)

### Why delegate

- Sub-agent has its own context budget — can crawl many sources without polluting my context
- Sourced brief becomes a persistent auditable artifact in the project
- Cross-checking across ≥2 sources is enforceable in the sub-agent's instructions
- I don't proceed until the brief file exists and I've read it

### Tool binding

- `create_agent` with `task_type="slides"`, `slides_subagent_role="research"`, `share_slides_project=true`

### Sub-agent instructions must specify

1. Which research questions to answer (from Task 4)
2. Output file path (e.g., `research/<topic>.md`)
3. Required format: every fact tagged with source URL + access date
4. Source tier requirements: prefer primary (filings, official stats, peer-reviewed) over secondary (analyst reports) over tertiary (blogs)
5. Cross-check rule: ≥2 independent sources for every quantitative claim
6. Grounding rule: no training-memory facts
7. Return format: one-line status + file path, not the whole brief in the message

### Sub-agent's tool inventory

The sub-agent internally uses:
- `web_search` — broad discovery
- `batch_web_search` — parallel queries
- `crawler` — deep read of specific URLs (with `render_js=true` if blocked)
- `summarize_large_document` — long PDFs and reports
- `Read` / `Write` — for the brief file

### Failure modes

- Dispatching without cross-check rule → single-source numbers slip through
- Not specifying output file path → brief comes back only in the chat message and is lost
- Accepting sub-agent's returned message as complete without reading the actual file

---

## Task 6 — Read and quality-check the research brief

### Sub-tasks

1. Read the brief file end-to-end
2. Spot-check 2–3 facts against the linked URLs (open them, verify claim matches)
3. Check date-stamps — flag anything >12 months old
4. Check source tiers — primary/secondary/tertiary balance
5. Cross-check that key quantitative claims have ≥2 sources
6. If quality is low → re-dispatch sub-agent with sharper instructions

### Prompt rules

- **Never accept a brief without spot-checking.** Sub-agent hallucinations happen.
- **Flag stale facts (>12mo)** and search for newer figures before using.

### Failure modes

- Accepting brief because "the sub-agent said it was done"
- Not verifying source URLs actually contain the claimed facts
- Using stale figures because they're the only ones in the brief

---

## Task 7 — Extract Core Message

### Definition

The one sentence that answers: *"If the audience remembers ONE thing from this deck, it should be: ___"*

### Rules for a valid Core Message

- **One sentence** (not two, not "and")
- **Contains a claim, not a topic**
  - ❌ "Q3 results" (topic)
  - ❌ "Q3 was strong" (vague)
  - ✅ "Q3 growth exceeded plan by 18%, driven by enterprise expansion"
- **Aligned with Phase 1 purpose** — persuade decks have argumentative messages; instruct decks have "you can now X" messages
- **Backed by material** — not aspirational; provable from source map

### Structure test

Core Message must have:
- **Subject** — what/who
- **Verb** — action or state
- **Specific outcome or judgment** — a number, a comparison, a stance

### Prompt rules

- **Enforce claim-structure.** If proposed message fails structure test, iterate.
- **Present 2–3 candidate Core Messages** and let user choose or adjust.
- **User must decisively confirm.** Not "sounds good" — a "yes, that's the message."

### Failure modes

- Treating topic as Core Message ("Q3 results" isn't a message)
- Accepting vague message ("Q3 was strong" — how strong? Compared to what?)
- Aspirational message that material doesn't support

---

## Task 8 — Build the per-slide source map

### Format

Render as a real Markdown table:

```
SOURCE MAP (draft)
──────────────────────────────────────────────────────────
| # | Projected content            | Source                    |
|---|------------------------------|---------------------------|
| 1 | Cover — company name         | User brand assets         |
| 2 | Agenda                       | Derived from outline      |
| 3 | Market size TAM              | Research brief §2 (Gartner 2025) |
| 4 | Our Q3 growth chart          | User PRD p.12 (Q3 numbers)|
| 5 | Competitive positioning      | Research brief §4         |
| 6 | Product roadmap              | User PRD p.28–31          |
| 7 | ⚠ Team headshots             | NEEDED — user to provide  |
| 8 | Ask (funding / decision)     | Strategy Summary          |
```

### Prompt rules

- **Real table, not narrative.** Blank cells must be visually obvious.
- **Every row must have a source.** Blank = red flag, must be resolved before Phase 3.
- **Internal artifact.** Does NOT appear on slides as `[Source: X]` badges unless deck style demands it.
- **This is the contract for Phase 3.** Phase 3 can only order and shape slides the source map permits.

### Failure modes

- Narrative source map ("mostly from PRD, plus research") → un-auditable
- Blank cells papered over ("we'll figure it out")
- Source map lists sources that don't actually cover the projected content

---

## Task 9 — Sufficiency check

### Test

At ~1 substantial info unit per slide (chart / claim / case / quote / illustration), can a deck of target length be filled with sourced content?

### Options if short

1. **Gather more material** (loop back to Task 1 for user materials or Task 5 for more research)
2. **Reduce deck length** (adjust Phase 1's target)
3. **Restructure** so blank rows become sub-points on covered slides (may reduce length organically)

### Prompt rules

- **Never pad to hit page count.** Padding = AI slop.
- **Present options to user, let them decide.**

---

## Tool inventory for Phase 2

| Tool | Purpose |
|---|---|
| `Read` | Read user materials |
| `import_pptx` | Structured PPTX ingestion |
| `import_pdf` | Structured PDF ingestion |
| `crawler` | Read user-pasted links |
| `summarize_large_document` | Long PDFs/reports |
| `create_agent` (`role=research`) | Dispatch research sub-agent |
| `Write` | Save gap list, source map, notes |
| `Glob` / `Grep` | Search across attached materials |
| `unified_ask_user_question` | Approve research questions, Core Message, source map |

**Not used**: image generation, slide writing, layout/screenshot verification.

**About inline research**: I *could* call `web_search` / `crawler` directly for very small clarifications, but Guide Mode prefers delegating substantive research to the sub-agent because (a) cross-checking is enforceable, (b) brief becomes an audit artifact, (c) my context stays clean.

---

## Weaknesses & optimization opportunities

### W1 — Inventory step skipped or shallow
**Symptom**: Large PPTX attached, I skim instead of full-read. Miss coverage → redundant research.
**Fix**: Enforce full-read + per-file "read summary" (2–3 lines shown to user) before any research dispatch.

### W2 — Gap list kept implicit
**Symptom**: Gap analysis stays in my head, sometimes I research covered topics.
**Fix**: Always write the gap list as an artifact; show to user before research.

### W3 — Research questions too broad
**Symptom**: "Research market size and competitors" → sub-agent returns shallow overview.
**Fix**: Force specific-question format ("What is the 2025 US market size for X per Gartner/IDC?"), max 5 questions per round, user-approved before dispatch.

### W4 — No primary/secondary/tertiary source ranking
**Symptom**: Research brief treats blog posts equally with SEC filings.
**Fix**: Sub-agent instructions require source tier tagging; primary preferred for numbers.

### W5 — Cross-checking not enforced
**Symptom**: Single-source numbers slip through (wrong Gartner figure gets cited).
**Fix**: ≥2 independent sources required for every quantitative claim; sub-agent flag single-source facts.

### W6 — Core Message confused with topic/theme
**Symptom**: "Q3 results" accepted as message. Actually a topic.
**Fix**: Enforce claim-structure (subject + verb + specific outcome).

### W7 — Source map narrative not tabular
**Symptom**: I describe source map instead of rendering a table. Blank cells hidden.
**Fix**: Always render as Markdown table.

### W8 — Sufficiency check happens too late
**Symptom**: We do research then discover length still doesn't fit.
**Fix**: Pre-research sufficiency estimate — "Your PRD covers ~7 slides worth. You want 15. Research needs to fill 8. Approve scope?"

### W9 — No content ROI filter when material > length
**Symptom**: I have material for 20 slides but deck is 10. I pick implicitly which 10.
**Fix**: Explicit prioritization — rank material by ROI for audience/purpose, present top-N + rejected list, user re-ranks.

### W10 — Research brief quality not spot-checked
**Symptom**: Accept brief because sub-agent reported done. Some facts don't match linked URLs.
**Fix**: Spot-check 2–3 facts against source URLs before proceeding to Task 7.

### W11 — Stale facts not flagged
**Symptom**: 2023 market size used for 2026 deck.
**Fix**: Date-stamp every quantitative fact in brief; flag anything >12mo old and search for newer figure.

### W12 — User material contradictions not surfaced
**Symptom**: PRD says $5M ARR p.3 and $8M ARR p.12. I use whichever I read last.
**Fix**: Flag internal contradictions in user materials during inventory; ask user which is correct.

### W13 — Sub-agent brief-file dependency has no fallback
**Symptom**: Sub-agent finished but brief file wasn't written. I stall.
**Fix**: Re-dispatch sub-agent once with explicit "WRITE the brief file" instruction. If still absent, treat sub-agent's returned message as brief. Never leave Phase 2 stalled.

### W14 — Scenario D (replication) still runs full Phase 2
**Symptom**: User wants PPTX byte-for-byte replicated. I still ask about gaps and research.
**Fix**: Scenario D skips Tasks 2–6, uses PPTX contents as-is.

### W15 — No confidence tagging on individual facts
**Symptom**: Brief mixes high-confidence facts (multi-source, primary) with low-confidence (single blog). Downstream can't tell.
**Fix**: Tag each fact in brief with confidence level (high/medium/low).

### W16 — Video/multimedia sources not handled
**Symptom**: If user references a YouTube talk or podcast, I have no path to extract facts from it.
**Fix**: Explicit sub-agent instruction to include transcript retrieval + timestamp citations if any multimedia source is provided.

---

## Handoff to Phase 3

Phase 3 receives:
- **Strategy Summary** (Phase 1)
- **Core Message** (Phase 2) — the north star
- **Per-slide source map** (Phase 2) — the *possible* slide universe
- **Confirmed length** (Phase 2) — target page count
- **Material inventory + research brief** — the reservoir Phase 3 draws from

Phase 3's job: take this material and arrange it into a *narrative sequence*. Phase 3 does not gather new material — if it discovers a gap, it loops back to Phase 2.
