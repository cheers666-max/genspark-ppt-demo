# 03 — Phase 3: Structure ("How to Tell the Story")

## Purpose

Transform sourced material from Phase 2 into a **narrative sequence** — an ordered outline where each slide has a specific job, and the sequence itself argues for the Core Message.

## Guiding principle

**A deck is an argument, not a document.** Structure isn't "list topics in an order" — it's "build a case such that by slide N, the audience *has to* agree with the Core Message." Order matters as much as content.

## Duration

3–5+ rounds. **The densest and highest-leverage phase.** ~80% of a deck's quality is determined here. Rushing = building good slides that don't add up to anything.

---

## Inputs consumed

- **Strategy Summary** (Phase 1) — filters what's worth saying
- **Core Message** (Phase 2) — north star each slide must support
- **Per-slide source map** (Phase 2) — the *possible* slide universe
- **Confirmed length** (Phase 2)
- **Material inventory + research brief** — the reservoir

## Outputs produced

- **Length + framework decision** (with rejected alternatives)
- **Section-by-section design** (opening / core beats / closing)
- **Case & example selections**
- **Chart decisions** — type + framing + emphasis
- **Page allocation** — exact slides per section
- **Final sealed outline** — the contract for Phase 4+5
- **Kill list** — considered but not included

## Gate criteria (all must pass to exit)

1. Title Test passes: reading slide titles alone tells a coherent story
2. Core Message trace: every slide can be justified as supporting Core Message
3. Evidence trace: every claim has backing source in source map
4. "So what" test: no section can be cut without something breaking
5. Explicit user approval on the FINAL complete outline

---

## Task 1 — Length recommendation

### Categories

| Category | Range | Fit |
|---|---|---|
| **Executive brief** | 5–8 slides | Short live talks (5–10 min), decision decks, follow-ups |
| **Comprehensive** | 10–15 slides | Standard business deck, 15–30 min talks, medium complexity |
| **Deep-dive** | 15+ slides | Technical, all-hands, read-only reports, training |

### Sub-tasks

1. State recommendation with reasoning tied to Phase 1 duration + audience
2. Show what we'd cut if user pushes shorter
3. Show what we'd expand if user pushes longer

### Prompt rules

- **Recommend with reasoning**, don't just pick.
- **Match to source map**: if source map has 8 rows, recommending 15 slides means padding (bad); recommending 8 slides fits.

### Failure modes

- Recommending by convention ("board decks are usually 12–15") instead of by material + duration
- Not showing tradeoff (cut/expand options)

---

## Task 2 — Framework selection

### Show outline in plain language FIRST, then name the framework

Users can't evaluate an abstract framework name. They can evaluate a concrete outline.

### Framework catalog

| Framework | Shape | Best fit |
|---|---|---|
| **Pyramid Principle** (Minto) | Answer first → supporting arguments → evidence | Executive audiences, time-pressured, decision decks |
| **SCQA** | Situation → Complication → Question → Answer | Persuasion, board approvals, skeptical audiences |
| **Hero's Journey** | Ordinary → Challenge → Transformation → New normal | Inspirational, keynote, brand story |
| **Why-How-What** (Sinek) | Purpose → Method → Deliverables | Vision decks, mission alignment, product launches |
| **Problem-Solution-Benefit** | Problem → Solution → Quantified benefit | Sales, pitch, feature announcements |
| **Chronological / Journey** | Time-ordered | Case studies, project retrospectives |
| **Compare-Contrast** | A vs. B | Vendor comparisons, competitive positioning, before/after |
| **Thematic** | Grouped by theme, not sequence | Portfolios, state-of-X reports, exploratory decks |

### Hybrid frameworks are legitimate

- "SCQA opening + Pyramid core" is a valid structure
- "Problem-Solution-Benefit with a Chronological case study inside"
- **Always name hybrids explicitly**, don't pretend they're single-framework

### Prompt rules

- **Outline in plain language before framework name.**
- **Explicitly mention what I rejected**: "I chose SCQA over Pyramid because your audience is skeptical — need to acknowledge tension before delivering answer."
- **Show the rejected framework's outline briefly**, so user can compare.

### Failure modes

- Leading with framework name ("Let's use Pyramid Principle") → user can't evaluate abstractly
- Not mentioning rejected alternatives → user assumes I only considered one option
- Pretending a hybrid is pure

---

## Task 3 — Opening design (first ~20% of deck)

### Options

| Approach | Best fit |
|---|---|
| **Cold open** | Provocative claim or data point. Expert audiences, no warm-up needed. |
| **Warm open** | Brief context / acknowledgment / agenda. Mixed audiences. |
| **Story open** | Anecdote, case, vignette. Skeptical or checked-out audiences. |
| **Question open** | Pose the question deck will answer. Persuasion decks. |
| **Number open** | Single arresting statistic. Short executive briefs. |

### Sub-tasks

1. Recommend approach based on audience stance (from Phase 1)
2. Sketch first 2–3 slides concretely
3. Get user approval on opening approach before designing middle

### Prompt rules

- **Opening is disproportionately important** — sets frame, earns attention, establishes trust.
- **Sketch concrete slides**, not just "story opening."
- **Approve opening before middle** — if opening is wrong, middle rebuild anyway.

### Failure modes

- Treating opening as boilerplate ("cover + agenda")
- Warm open for expert audience → wastes their time
- Cold open for skeptical audience → they disengage before we build trust

---

## Task 4 — Core argument design (middle ~60%)

### Structure as claims + evidence, not topics

For each major argument beat:

- **Claim** — one sentence, what we're asserting
- **Evidence** — what material from source map backs it
- **Why here** — why this comes before next beat

### Beats vs. slides

One beat may be one slide or three, depending on evidence density. Beat count usually:
- Executive brief: 3–5 beats
- Comprehensive: 5–8 beats
- Deep-dive: 7–12 beats

### Prompt rules

- **Beats are claims, not topics.**
  - ❌ "Market. Competition. Product. Team. Ask." (topics)
  - ✅ "Market is shifting → competition is behind → our product exploits shift → team can execute → here's what we need." (claims)
- **Each beat has: claim + evidence + placement rationale.**

### Failure modes

- Topic list masquerading as outline
- Beat with no evidence in source map → structural gap, roll back to Phase 2
- Non-sequitur beat order (Beat 3 doesn't follow from Beat 2)

---

## Task 5 — Closing design (last ~20%)

### Options

| Approach | Best fit |
|---|---|
| **Call-to-action** | Explicit next step ("approve budget by Friday") |
| **Summary close** | Recap argument as takeaway list |
| **Vision close** | Paint picture of what happens if audience acts |
| **Question close** | Hand audience a question to sit with (boards, discussion) |
| **Circle-back close** | Return to opening image/story, now transformed |

### Prompt rules

- **Closing must serve Phase 1 purpose.** Persuade decks need call-to-action or vision. Inform decks (rare) need summary.
- **If purpose is "decide" — closing must ask for the decision.**

### Failure modes

- Generic "Thank you / Questions?" close on a persuasion deck
- Vision close on a "decide now" deck (feels evasive)
- No call-to-action when audience needs one

---

## Task 6 — Case & example selection

### Present alternatives, never assume

For each slide needing an illustration (case study, data example, customer story, chart):

```
For slide 7 (competitive positioning), I can use:
  [A] The Acme case — high growth, clean numbers, small player
  [B] The Beta case — larger player, messier data, more analogous
  [C] Aggregate market data — no single case, broader picture, less concrete

I recommend [B] because your audience knows Beta. Which do you prefer?
```

### Prompt rules

- **Always present ≥2 alternatives** for high-stakes case slides.
- **State recommendation with reasoning.**
- **If I can't think of alternatives** → source map is thin, roll back to Phase 2.

### Failure modes

- Picking a case implicitly
- Presenting only my preferred case ("here's the Beta case, sound good?")
- Choosing a case the audience doesn't know → undermines credibility

---

## Task 7 — Chart type + framing + emphasis

### Lock chart decisions in Phase 3, not Phase 5

Chart choice is a *structural* decision (what audience notices), not implementation detail.

### For each chart, decide

1. **Type** — bar / line / stacked / scatter / table / big number / donut / etc.
2. **Framing** — absolute values / percentages / indexed / YoY change
3. **Emphasis** — what should audience notice first?
4. **Data source** — from Phase 2 source map (never fabricated)

### Present alternatives for high-stakes charts

```
For Q3 growth chart:
  [A] Quarterly revenue bar chart, 8 quarters — shows trend, Q3 doesn't stand out
  [B] YoY % change line — Q3 pops, hides absolute scale
  [C] Combined bars for revenue + line for YoY% — richer, denser

Recommend [C] for board (density OK), [B] for live talk.
```

### Prompt rules

- **Chart decisions locked in Phase 3.**
- **Real `<table>` for data tables**, never chart library — PPTX export requires real tables to make them editable downstream.
- **No fabricated data.** Numbers come from Phase 2 source map.

### Failure modes

- "Figure out chart in Phase 5" → discover chart type doesn't fit data
- Chart that doesn't serve the beat's claim
- Made-up numbers filling in for missing data

---

## Task 8 — Page allocation (SEPARATE step)

### Only AFTER outline agreed, allocate slides per section

```
PAGE ALLOCATION
────────────────────────────────
Opening (Task 3)         2 slides
Beat 1: Market context   2 slides
Beat 2: Our growth       3 slides   ← densest, most evidence
Beat 3: Why now          2 slides
Beat 4: What we need     2 slides
Closing (Task 5)         2 slides
────────────────────────────────
Total:                   13 slides
```

### Prompt rules

- **Strictly separate from outline review** — different decision.
- **Allocate by argument weight**, not symmetry.
- **Extra slides for Beat 2 mean fewer for Beat 3** — tradeoffs must be visible.

### Failure modes

- Combining allocation with outline → users rubber-stamp allocation
- Symmetric allocation ("2 slides per section") that doesn't fit argument weight
- Not tracking total against target length

---

## Task 9 — Final outline consolidation

Re-present complete outline as single artifact:

```
FINAL OUTLINE
────────────────────────────────────────────────
1.  Cover                             [chrome]
2.  Opening: [story hook title]       [narrative]     ← Story open
3.  Agenda                            [nav]
4.  Beat 1a: Market frame             [claim + chart] ← Src: research §2
5.  Beat 1b: Our position             [claim + case]  ← Src: PRD p.12
6.  Beat 2a: Growth chart             [data]          ← Src: PRD p.15
7.  Beat 2b: Growth drivers           [claim + list]  ← Src: PRD p.16-18
8.  Beat 2c: Case study — Beta        [case]          ← Src: research §4
9.  Beat 3a: Why now                  [claim]         ← Src: research §7
10. Beat 3b: Cost of delay            [claim + chart] ← Src: PRD p.22
11. Beat 4a: The ask                  [call-to-action]
12. Beat 4b: What we need from you    [call-to-action]
13. Closing: Circle-back              [narrative]
```

### Each row includes

- Slide number
- Draft title (real, not "Section 1")
- Slide's job / content type
- Backing source from source map

### Prompt rules

- **This is the contract for Phase 4+5.** After approval, outline is sealed.
- **Draft real titles** in Phase 3, not "Market Overview" generic labels.
- **Rollback rule**: if Phase 5 build reveals a structural gap, STOP and return to Phase 3.

### Failure modes

- Generic titles carried through to final deck
- Missing source column → some slides can't be filled from source map
- Approving outline without doing Title Test

---

## Task 10 — Section-by-section review (workflow rule, not sequential task)

### Review outline in logical chunks, NOT all at once

- **Opening review** (Task 3 output) → approve → proceed
- **Core beats review** (Task 4 output) → approve → proceed
- **Closing review** (Task 5 output) → approve → proceed
- **Final outline consolidation** (Task 9) → final approval

### Why

Dumping a 15-slide outline for review = user gives shallow "looks good" feedback → real issues surface in Phase 5.

### Prompt rules

- **Never present the full outline for the first review in one shot.**
- **Small chunks force real evaluation.**

---

## Task 11 — Dissatisfaction handling (workflow rule)

### When user says "this doesn't feel right"

**Never ask** open-ended "what would you change?" — puts design burden back on them.

**Diagnose first**: "It sounds like you're concerned Beat 3 doesn't follow from Beat 2 — is that the issue?"

Then propose [A/B/C] fixes.

### Prompt rules

- **Always diagnose before offering fixes.**
- **Never ask open-ended change questions.**

### Failure modes

- Open-ended "what would you change?" → user gives vague answer → I guess wrong → iterate poorly
- Guessing what the user meant without diagnosing → fix wrong problem

---

## Task 12 — Kill list (parallel artifact)

Maintain a visible list of "things considered but not included, and why":

```
KILL LIST
────────────────────────────────
- Competitive teardown of Acme — considered as slide 8, cut because
  audience doesn't know Acme; using Beta instead.
- Team headcount slide — considered, cut because purpose is
  "persuade board on growth", not "reassure on execution".
- Product roadmap page 2 (2027 vision) — cut for length; may add
  in Phase 5 if we have room.
```

### Prompt rules

- **Prevents re-litigation** — user proposes something I already considered
- **Gives user override option** — they can re-add if they disagree with cut
- **Kept as a project file** for future reference

---

## Tool inventory for Phase 3

| Tool | Purpose |
|---|---|
| `unified_ask_user_question` | Every consultative round |
| `Write` | Save outline drafts as internal files (`.guide/outline-draft-N.md`) |
| `Read` | Re-read Strategy Summary + Core Message + source map when making structural decisions |

**Not used**: web search, crawler (would mean rolling back to Phase 2), image generation, slide writing, verification tools, sub-agent dispatch.

---

## Weaknesses & optimization opportunities

### W1 — Framework named before shown
**Symptom**: Lead with "let's use Pyramid" instead of showing concrete outline.
**Fix**: Always show outline in plain language first, then name framework.

### W2 — Full outline reviewed at once
**Symptom**: 15-slide outline dumped for review → shallow "looks good" feedback → issues surface in Phase 5.
**Fix**: Section-by-section review (opening / core / closing separately).

### W3 — Topic list masquerading as outline
**Symptom**: Outline items are topic nouns ("Market. Product. Team.") instead of claims.
**Fix**: Enforce claim-structure in outline items — every job description is a claim, not a topic.

### W4 — Case selection without alternatives
**Symptom**: Pick a case implicitly. Wrong case discovered in Phase 5.
**Fix**: Force ≥2 alternatives for every case slide. If I can't think of alternatives, source map is thin — roll back to Phase 2.

### W5 — Chart decisions deferred to Phase 5
**Symptom**: "Figure out chart in build." Chart type doesn't fit data or beat.
**Fix**: Lock chart type + framing + emphasis in Phase 3.

### W6 — Page allocation combined with outline review
**Symptom**: Mixed decision → users focus on flow, rubber-stamp allocation.
**Fix**: Strict separation — outline review, then separate allocation round.

### W7 — No kill list
**Symptom**: User proposes things I already considered and rejected.
**Fix**: Maintain visible kill list throughout Phase 3.

### W8 — Opening/closing under-designed
**Symptom**: Treated as boilerplate (cover + summary slide).
**Fix**: Treat as separate design decisions with alternatives.

### W9 — Open-ended dissatisfaction questions
**Symptom**: Ask "what would you change?" — puts burden on user.
**Fix**: Diagnose first, offer [A/B/C] fixes.

### W10 — Hybrid frameworks not acknowledged
**Symptom**: Real deck is SCQA + Pyramid, described as pure single-framework.
**Fix**: Explicitly name hybrids ("SCQA opening with Pyramid core").

### W11 — No delivery-time simulation
**Symptom**: 15-slide outline looks good but runs 25 min when user has 15.
**Fix**: For live talks, simulate delivery time (1–2 min per slide depending on density). If over budget, cut in Phase 3, not after.

### W12 — Rollback to Phase 2 rarely triggered
**Symptom**: Phase 3 hits a source-map gap; I work around instead of rolling back.
**Fix**: Explicit rule — if beat can't be supported by source map, STOP outlining, return to Phase 2.

### W13 — Section labels vague
**Symptom**: "Market", "Product" instead of claim-shaped labels.
**Fix**: Section labels must have a verb ("The market shifted in Q2 and hasn't recovered").

### W14 — Draft titles generic
**Symptom**: "Market Overview" carried through to final deck.
**Fix**: Draft real titles in Phase 3, refine later.

### W15 — No audience-question simulation
**Symptom**: Outline designed from our side ("what we want to say") without checking audience's likely questions.
**Fix**: List top 3–5 audience questions, confirm outline answers them in sensible order.

### W16 — No objection map for persuasion decks
**Symptom**: Persuasion deck doesn't address obvious audience objections.
**Fix**: List top 3 objections; confirm each has a slide (or slides) addressing.

### W17 — Complexity budget not tracked
**Symptom**: Too many new concepts introduced across outline → audience overwhelmed.
**Fix**: Track "new-concept count" — rule of thumb 1 major new concept per 3 slides.

### W18 — No content-density preview
**Symptom**: Outline looks reasonable but some slides will be walls of text, others empty.
**Fix**: Flag each outline slide with expected density (light/medium/heavy).

---

## Handoff to Phase 4

Phase 4 receives:
- **Final sealed outline** (Phase 3) — slide-by-slide with titles, roles, content types, sources
- **Density expectations per slide** (if W18 implemented)
- **Chart decisions** — locked type + framing
- **Case selections** — locked
- **Page allocation** — locked
- **Kill list** — considered-but-not-included, for reference

Phase 4's job: decide *how it looks* — visual language, density style, brand assets. Phase 4 does NOT change what's on each slide, only how it's rendered.
