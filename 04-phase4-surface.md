# 04 — Phase 4: Surface ("How It Looks")

## Purpose

Lock the **visual language and information density** of the deck before any HTML is written. This is the last phase before the execution gate opens.

## Guiding principle

**Form follows delivery.** A deck designed for a live 10-minute talk and a deck designed for an emailed board doc look opposite — one has few words and large visuals, the other has dense text and detailed charts. Phase 4 forces the choice.

## Duration

1–2 rounds. Shorter than Phase 3 because most inputs are already fixed by Phase 1 + 3.

---

## Inputs consumed

- **Strategy Summary** (Phase 1) — especially delivery context (live/async, duration, setting)
- **Final sealed outline** (Phase 3)
- **User's stated visual reference** (from Phase 1 dim 3) — if any
- **User's uploaded brand assets** (logos, templates, brand guides)
- **Skills catalog** — user's personal skills + public gallery match candidates

## Outputs produced

- **Density decision** — Presentation / Read-only / Hybrid
- **Visual source** — A (user template) / B (skill) / C (screenshot ref) / D (from scratch)
- **Brand asset inventory** + missing-asset list
- **Type system** — numeric scale, weights, fallbacks
- **Palette** — explicit hex codes, contrast-checked
- **Layout patterns** — cover / section divider / standard / data / closing
- **Chrome spec** — logo, page number, footer, dividers
- **Design Summary** — the consolidated artifact

## Gate criteria (all must pass to exit)

1. Density locked (one of three, or explicit per-section split)
2. Visual source concrete (not "modern and professional")
3. Missing assets identified with a plan (user providing / placeholder / skip)
4. Palette contrast-checked
5. Explicit user approval on Design Summary

---

## Task 1 — Information density decision

### The single most consequential Phase 4 decision

| Style | Density | Characteristics | Delivery fit |
|---|---|---|---|
| **Presentation (Steve Jobs)** | Very low text | 1 headline + 1 visual per slide; speaker carries narrative; large type; big imagery | Live keynotes, stage talks, sales pitches, investor pitches |
| **Read-only (Consulting)** | High text | Dense body copy, detailed charts, footnotes, self-explanatory; smaller type; information-rich | Emailed decks, board documents, technical memos, McKinsey/BCG-style |
| **Hybrid** | Mixed | Visual hero slides + detailed supporting slides | Long meetings with Q&A, mixed live+distributed, all-hands |

### Cascades from this decision

- Font size floor (24pt+ for presentation, 12pt+ for read-only)
- Chart complexity (single big number vs. multi-series with legend)
- Bullet density (0–3 per slide vs. 5–10)
- White space budget (generous vs. tight)
- Imagery ratio (>50% visual vs. <20% visual)

### Prompt rules

- **Recommend based on Phase 1 delivery context.**
  - Live 15-min → Presentation or Hybrid
  - Emailed to regulator → Read-only
  - Live with slides also emailed after → Hybrid (default for mixed use)
- **Allow explicit per-section density** when hybrid — but split by section, not per-slide (preserves coherence).

### Failure modes

- Presentation style for a deck that will primarily be read (audience lost)
- Read-only style for a live talk (audience overwhelmed by text)
- "Somewhere between" hybrid without specifying which slides are which style

---

## Task 2 — Visual reference source

### The four sources, ranked by quality ceiling

| Source | Quality | When |
|---|---|---|
| **A. User brand template / design system** | 🔥 Highest | User has formal brand kit, template PPTX, or design system |
| **B. Selected skill from catalog** | 🔥 High | Curated template matches topic; skills bundle full visual identity |
| **C. Existing deck / screenshot** | 🟡 Medium-High | User has past deck they liked or competitor deck to emulate |
| **D. From scratch** | 🟢 Medium | No reference; I pick direction and state it explicitly |

### Detection sequence

1. Did user attach PPTX/PDF/brand-guide? → route to A
2. Does user's personal skills catalog have a topic match? → surface as B option
3. If no personal match, browse public catalog → surface top matches as B option
4. Did user attach screenshots? → route to C
5. Otherwise → D, but state specific aesthetic direction

### Prompt rules

- **Proactively check skill catalog** before defaulting to D.
- **For D (from scratch), name the topic stereotype and counter it.**
  - AI deck stereotype: deep blue + circuit motifs → propose warm earth-tones + editorial serif instead
  - Finance stereotype: navy + gold serif → propose muted contemporary palette
  - Healthcare stereotype: teal + green → propose warm neutral + single accent
- **Never accept "modern and professional" as a direction** — too vague to build against.

### Failure modes

- Defaulting to D without checking skills → worse output
- Stereotype default under D → generic AI-slop feel
- Accepting vague direction → visual drift across slides

---

## Task 3 — Brand asset collection

### Assets to collect

- **Logo(s)** — primary + variants (mono, reversed for dark bg)
- **Brand colors** — hex codes for primary + accent + neutrals
- **Typography** — brand fonts with fallback stack
- **Photography style** — if brand has one (candid vs. studio, warm vs. cool)
- **Iconography** — line/filled/duotone/none
- **Chrome elements** — footers, page numbers, dividers, brand marks

### Prompt rules

- **Assets are UPLOADED, never searched.** Do not guess a company's logo file or invent hex codes.
- **Never generate fake logos.** If user says "our company is Acme," use text lockup or placeholder — don't AI-generate an "Acme logo."
- **Collect BEFORE designing.** If user says "we have a brand template," pause Phase 4 until it's uploaded.

### Failure modes

- Designing without brand assets, then discovering in Phase 5 we need them
- Placeholder logos rendered as real logos
- Guessing brand colors from company website (may be marketing site palette, not brand system)

---

## Task 4 — Type system

### Decisions to lock (numeric, not verbal)

- **Type pair** — display font (titles) + text font (body). Sometimes one font in multiple weights.
- **Type scale** — explicit pt values:
  ```
  Title:       48pt
  Subtitle:    28pt
  Section h:   36pt
  Body:        18pt
  Caption:     14pt
  Footnote:    11pt
  ```
- **Weight ladder** — which weights where (700 titles, 400 body, 600 emphasis)
- **Line-height** — tighter for titles (1.1–1.2), looser for body (1.4–1.6)

### Font rules

- **NEVER use `Hiragino Kaku Gothic ProN`** (macOS-only, breaks PPTX/PDF exports on Windows)
- **Avoid overused defaults** (Inter, Roboto, Arial, system fonts) unless brand explicitly uses them
- **CJK content**: verify font stack renders correctly on Windows (Meiryo, Noto Sans CJK, etc.)
- **Fallback stack always included** — brand font + 2–3 fallbacks + generic family

### Prompt rules

- **Numeric scale in Design Summary**, not verbal ("large title / medium body")
- **Written to a shared CSS file** in Phase 5 (`assets/chrome.css` with CSS variables)

### Failure modes

- Verbal type scale ("large / medium / small") → drift across slides
- Missing fallback stack → font failure renders in browser default
- CJK font issues discovered only in export

---

## Task 5 — Palette

### Locks

- **Primary** — 1 dominant brand color
- **Secondary / accent** — 1–2 supporting
- **Neutrals** — grays (4–6 steps from near-black to near-white)
- **Semantic** — data positive/negative/neutral
  - Default green/red is color-blind unfriendly
  - Consider blue/orange as accessible alternative
- **Background(s)** — 1–2 max (light + optional dark for section dividers)

### Contrast check (mandatory)

- Body text on background: ≥4.5:1 contrast ratio
- Large text (18pt+) on background: ≥3:1
- If brand color fails contrast for text: keep brand color for shapes/accents, use adjusted variant for text

### Anti-patterns

- More than 2 background colors (visual chaos)
- Gradient backgrounds unless brand-mandated (AI-slop tell)
- Rainbow palette (no semantic coherence)

### Prompt rules

- **Contrast-check every palette in Phase 4.** Flag issues before build.
- **State hex codes explicitly** in Design Summary.

### Failure modes

- Brand yellow used for body text → unreadable
- Green/red semantic on a color-blind audience
- Discovered contrast issues in Phase 5 after slides built

---

## Task 6 — Layout system

### Named layout patterns

- **Cover** — title slide
- **Section divider** — new section intro
- **Standard content** — 1-column? 2-column? Left-aligned or centered? Chrome placement?
- **Data slide** — chart framing, caption placement
- **Comparison** — A-vs-B slides
- **Closing** — mirror cover or distinct

### Chrome spec (locked as single artifact)

- Logo — placement + size
- Page number — placement + format
- Footer — content + style
- Section marker — if used
- Exceptions — cover has no page number, etc.

### Prompt rules

- **Chrome spec is ONE description that applies to every slide.** Where chrome varies, state exceptions explicitly.
- **Sketch layout wireframes** (even ASCII) for at least the standard content layout — reduces Phase 5 rework.

### Failure modes

- Chrome decided ad-hoc during build → drift (logo at (40,40) vs (44,42) across slides)
- Verbal layout description too vague → Phase 5 layouts don't match user expectation

---

## Task 7 — Iconography decision (explicit choice)

### Options

- **None** — no icons anywhere
- **Line icons** — lightweight, technical feel
- **Filled icons** — heavier, more editorial
- **Duotone** — two-color, more distinctive
- **Emoji as icons** — casual, rare use

### Prompt rules

- **Explicit decision in Phase 4**, don't let it drift into Phase 5.
- **Avoid emoji unless brand explicitly uses.**
- **If no icon library available**, choose "None" and lean on typography.

---

## Task 8 — Motion decision

### Options

- **No motion** — default. PPTX/PDF export flattens anyway.
- **Subtle CSS transitions** — hover states, fade-ins (web preview only)
- **Slide-in animations** — for live talks, if requested

### Prompt rules

- **Default is no motion.** Only add if explicitly needed.
- **PPTX export flattens motion** — don't design around it.

---

## Task 9 — Photography / imagery direction

### If deck uses photos

- **Style** — candid vs. studio, warm vs. cool, tight vs. wide
- **Subject matter** — people / products / abstract / environments
- **Source** — user uploads / stock photography / AI-generated

### If AI-generated

- Style becomes the shared prompt DNA for consistency across images
- Confirm with user before generating (credit + time cost)
- Model choice: photorealistic + in-image text OR stylized / identity-consistent (see `07-models-and-tools.md`)

### Prompt rules

- **Explicit photography direction in Phase 4** if deck uses photos
- **AI generation gated on per-image confirmation** in Phase 5

---

## Task 10 — Design Summary consolidation

Render as structured artifact:

```
DESIGN SUMMARY
──────────────────────────────────────────────
Density:       [Presentation / Read-only / Hybrid]
               Reasoning: [why, tied to delivery context]

Visual source: [A/B/C/D + specific reference]
               Rejected: [what I didn't pick and why]

Type system:
  Display:     [font, weights, size range]
  Body:        [font, weights, size range]
  Fallback:    [stack]
  Scale:       Title 48pt / Section 36pt / Body 18pt / ...

Palette:
  Primary:     #XXXXXX
  Accent:      #XXXXXX
  Neutrals:    #XX, #XX, #XX, #XX
  Semantic:    positive #XX / negative #XX
  Background:  #XX (+ #XX for section dividers)
  Contrast:    Verified all text ≥4.5:1

Layouts:
  Cover:            [description + wireframe]
  Section divider:  [description]
  Standard content: [description + wireframe]
  Data slide:       [description]
  Closing:          [description]

Chrome:
  Logo:        [placement, size]
  Page number: [placement, format]
  Footer:      [content, style]
  Exceptions:  [e.g., cover has no page number]

Iconography:   [None / Line / Filled / Duotone]
Motion:        [None / Subtle / Slide-in]
Photography:   [Style direction if applicable]

Missing assets: [list — needed before build]
──────────────────────────────────────────────
```

### Prompt rules

- **Always render as structured block**, not conversational.
- **Explicit approval required** before Phase 5.

---

## Tool inventory for Phase 4

| Tool | Purpose |
|---|---|
| `unified_ask_user_question` | Consultative rounds |
| `load_skill` | Install skill from catalog when option B is chosen |
| `Read` | Inspect skill contents, brand guides, uploaded templates |
| `import_pptx` | If user uploaded a template PPTX for reference |
| `import_pdf` | If user uploaded a brand guide PDF |
| `Write` | Save Design Summary as internal file |

**Not used**: slide writing, image generation, screenshot, layout verification (no slides yet), web search (visual references are uploaded, never searched).

---

## Weaknesses & optimization opportunities

### W1 — Density decision oversimplified as binary/trinary
**Symptom**: Real decks are hybrid but I force choice; hybrid answer becomes "somewhere between" without specification.
**Fix**: Allow explicit per-section density ("Section 1 presentation, appendix read-only") — but require split by section, not per-slide.

### W2 — Skill catalog not proactively checked
**Symptom**: Default to source D without surfacing available skills.
**Fix**: Always check user's personal skills + public catalog for topic match before offering D.

### W3 — Brand assets asked for too late
**Symptom**: Design in Phase 4, discover in Phase 5 we need logo. Wait or placeholder.
**Fix**: Collect brand assets as FIRST Phase 4 sub-task.

### W4 — Palette not contrast-checked
**Symptom**: Yellow text on white slides. Fix in Phase 5.
**Fix**: Contrast-check palette in Phase 4; propose text-safe variants if brand color fails.

### W5 — Type scale verbal, not numeric
**Symptom**: "Large title, medium body." Drift across slides.
**Fix**: Numeric pt values in Design Summary, materialized as CSS variables in Phase 5.

### W6 — Layout patterns described, not sketched
**Symptom**: Verbal description leaves ambiguity → Phase 5 layouts don't match user expectation.
**Fix**: ASCII or quick wireframes for at least standard content layout.

### W7 — Chrome decided per-slide
**Symptom**: Logo placement drifts across slides.
**Fix**: Lock chrome as single spec that applies uniformly; state exceptions.

### W8 — Stereotype not proactively countered under D
**Symptom**: AI deck defaults to blue + circuits → generic feel.
**Fix**: Under D, name topic stereotype and counter-propose. User can veto but choice is conscious.

### W9 — Iconography left to drift
**Symptom**: Decided implicitly on slide 1, drifts across deck.
**Fix**: Explicit iconography decision in Phase 4.

### W10 — Fallback fonts implicit
**Symptom**: Brand font declared without fallback. Font fails → browser default renders.
**Fix**: Fallback stack mandatory in every font declaration.

### W11 — Photography direction skipped
**Symptom**: Deck uses photos but style is inconsistent (mix of studio and candid, warm and cool).
**Fix**: Explicit photography direction if photos used.

### W12 — No visual density preview
**Symptom**: User approves "read-only style" without seeing what that looks like. Surprise in Phase 5.
**Fix**: Show reference examples per density style (from skills, past decks, or quick sketch).

### W13 — Motion decision skipped
**Symptom**: Motion drifts in based on my defaults.
**Fix**: Explicit motion decision in Phase 4.

### W14 — Bulk-copying skill resources
**Symptom**: Using a skill, I copy all its assets bloating the project.
**Fix**: Selective copying — write slides first, then copy only referenced assets.

### W15 — No accessibility beyond contrast
**Symptom**: Color-blind semantic colors (red/green) used without alternative.
**Fix**: Semantic palette choice should default to color-blind-safe (blue/orange) unless user overrides.

### W16 — Dark mode not considered
**Symptom**: If deck will be viewed in dark room / on dark screen, palette may not work.
**Fix**: Ask about viewing environment in Phase 1; adapt palette in Phase 4.

---

## Handoff to Phase 5

Phase 5 receives:
- **Final outline** (from Phase 3) — content spec
- **Design Summary** (from Phase 4) — visual spec
- **Brand assets** — actual files ready to reference
- **Loaded skill or template** — if source A/B
- **Missing-asset list** — flagged items to work around or wait on

**Execution gate opens.** Slide-creation tools become available.

**After Phase 4 approval**:
- Outline is doubly sealed
- Design system is sealed
- If Phase 5 reveals: structural gap → return to Phase 3; content gap → return to Phase 2; visual issue → revise Phase 4 spec, don't improvise.
