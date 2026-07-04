# 05 — Phase 5: Execution & Reflection

## Purpose

Turn the sealed specs from Phases 1–4 into actual slide files, verify quality, and reflect on the finished deck against the original strategy.

## Guiding principle

**Phases 1–4 do the thinking; Phase 5 does the executing.** If earlier phases were done well, Phase 5 is largely mechanical. If earlier phases were rushed, Phase 5 becomes chaotic rework.

## Sub-structure

- **Part A — Execution** (build the deck)
- **Part B — Reflection** (structured self-review before handoff)

## Duration

Variable — driven by deck length and complexity. Not counted in "rounds" the way earlier phases are.

---

## Inputs consumed

- **Strategy Summary** (Phase 1)
- **Core Message + source map + material inventory + research brief** (Phase 2)
- **Final sealed outline** (Phase 3)
- **Design Summary + brand assets + loaded skill** (Phase 4)

## Outputs produced

- **Complete `.slides/` folder** at project root
- **Manifest with full playlist**
- **All slide HTML files** — verified geometrically + visually
- **Assets** — copied and referenced correctly
- **Handoff document** (if W20 implemented) — summary of what was built
- **Optional data-verify verdict file** (if data-verify sub-agent dispatched)

## Gate criteria (Phase 5 exit — all must pass)

1. All planned slides built (playlist matches file system)
2. Paired verification clean on all slides
3. Reflection completed (6 checks run)
4. Approved fixes applied and re-verified
5. Explicit user acceptance

---

# PART A — EXECUTION

## Task A1 — Project scaffolding

### Create folder structure

```
<deck-name>.slides/
    manifest.json
    slides/
    assets/
```

### Deck naming rules

- Lowercase kebab-case ending with `.slides`
- No spaces, no uppercase, no underscores
- Descriptive but concise (`q3-board-review.slides`, not `MyDeck.slides`)

### Manifest schema

```json
{
  "schemaVersion": "1.0",
  "format": "html",
  "metadata": {
    "title": "...",
    "description": "...",
    "author": ""
  },
  "canvas": {"width": 1920, "height": 1080},
  "playlist": []
}
```

### Canvas

Default 1920×1080 (16:9) unless user specified otherwise in earlier phases.

### Tool binding

- `Write` — for manifest.json

---

## Task A2 — Playlist-first authoring

### Write all planned filenames into playlist BEFORE writing any bodies

Why: preview shows skeleton placeholders for missing files → user sees deck structure immediately → progress visible as each body arrives.

### Filenames

Descriptive kebab-case, matching Phase 3 outline titles:
- ✅ `q3-growth-chart.html`, `market-context.html`, `competitive-position.html`
- ❌ `slide-1.html`, `page5.html`, `Slide_1.html`

### Prompt rules

- **Playlist first, bodies after.** Not the other way around.
- **Order matches Phase 3 outline.** Reorder by rewriting the playlist array, never by renaming files.

---

## Task A3 — Design system files

### Before authoring individual slides

Create shared design files under `assets/`:

- `assets/chrome.css` — shared type scale (CSS variables), color variables, chrome styles
- `assets/fonts/` — brand fonts if provided, with fallback declarations
- `assets/logos/` — brand logos ready to reference
- `assets/colors.css` (optional separate) — palette as CSS custom properties

### CSS variable convention

```css
:root {
  --font-title: 48pt;
  --font-section: 36pt;
  --font-body: 18pt;
  --font-caption: 14pt;
  --font-footnote: 11pt;

  --color-primary: #XXXXXX;
  --color-accent: #XXXXXX;
  --color-bg: #XXXXXX;
  --color-text: #XXXXXX;
  --color-muted: #XXXXXX;
}
```

Every slide `<link>`s this CSS. Changes propagate uniformly.

### Prompt rules

- **Design system files exist before slide 1 is authored.**
- **Never hardcode pt values or hex codes in individual slides.**

---

## Task A4 — Sample slide checkpoint (MANDATORY)

### Before generating full deck, build

- The **cover slide**
- **1–2 distinct content layouts** representing the design system in action

### Screenshot and present for explicit approval

Approval criteria:
- Template / design fidelity — matches Phase 4 reference or aesthetic direction
- Information density — matches Phase 4 density choice
- Brand asset usage — logo, colors, type actually applied
- Layout patterns — chrome, spacing, alignment

### If rejected

- Revise visual approach and re-sample
- **Outline is sealed** — don't rewrite structure to accommodate visual issues

### Prompt rules

- **This checkpoint is non-skippable.** If user pushes to skip, acknowledge risk explicitly and record override, but still build sample first.
- **Fixing 2 sample slides is ~20× cheaper than fixing 15 built slides.**

### Failure modes

- Skipping sample under user pressure → visual issues surface at slide 15
- Building sample but not screenshotting → user approves visually-unseen work
- Approving sample verbally without capturing screenshot as artifact

---

## Task A5 — Batch authoring

### Once sample approved, build the rest

Key rules:
- **Batched writes**: 5–8 slides per response using parallel `Write` calls, NOT one at a time
- **Playlist order**: build in playlist order (cover first, then slide 2, then 3...) so preview fills linearly
- **Ordering exception**: complex or high-risk slides (dense data, animated charts, novel layouts) can be batched later so simpler slides validate the system first

### Per-slide authoring workflow

1. Look up outline entry (Phase 3) — title, role, content type
2. Look up density style + layout pattern + chrome (Phase 4)
3. Look up backing source (Phase 2 source map)
4. Write complete standalone HTML file following editor contract

---

## Task A6 — Editor contract enforcement

### Invariant 1 — Editable-object contract

- Every direct child of `.slide-container` is ONE semantic section
- Marked `data-object="true"` with `data-object-type="textbox|image|shape|icon|chart|table"`
- **Flat structure** — no data-object nests another
- Icons and charts always their own data-object, never embedded inside a textbox
- Data tables use real `<table>` elements, marked `data-object-type="table"`, NOT chart libraries
  - Real `<table>` → PPTX export makes editable table
  - Chart library → exports as image

### Invariant 2 — Static fit

- Zero viewer interaction — no scrolling, no overflow
- Content MUST fit `canvas.width × canvas.height` exactly
- Never `overflow: auto/scroll` anywhere
- Never `scrollIntoView` from slide scripts

### Positioning rules

- Inline `style` only for positioning (not Tailwind, not CSS classes for layout)
- `<body>`: `margin:0; padding:0; overflow:hidden`, no centering
- `.slide-container` at (0,0): `position:relative; width:XXXXpx; height:XXXXpx; overflow:hidden`
- Each data-object: `position:absolute; left:<n>px; top:<n>px` (never `right`/`bottom`)
- z-index by type: shape = 1 · image = 5 · textbox/icon/chart = 10

### Grid/flex INSIDE a data-object

Welcome. From the editor's view each data-object is an opaque box identified by its outer `left/top/width/height`; what happens inside is free.

### Geometry checks

- Same-column textboxes (overlapping `left`+`width`), sorted by `top`: `B.top ≥ A.top + A.height + 5`
- Textbox/icon inside a shape: ≥6px padding from every edge
- Centered text: full-width textbox + `text-align:center`, NOT narrow textbox offset with computed `left`
- Fixed `height` on textbox: only when `font_size × line_height × line_count + padding` verifiably fits; otherwise omit `height`
- Nothing extends past canvas bounds
- Borders are 1–4px — never use position coordinates as border widths

### Prompt rules

- **Hard-lint every slide** against editor contract before finishing.
- **If a data-object contains another data-object**, refactor to siblings.

### Failure modes

- Nested data-objects → editor loses element tracking
- Tailwind classes for positioning → editor can't read position
- `overflow: auto` snuck in → viewer scrolling introduced
- Fake `<table>` with div grid → PPTX exports as image, not editable

---

## Task A7 — Asset handling

### User-provided assets

- Copy from user upload into `<deck>.slides/assets/`
- Reference via relative path: `<img src="../assets/logo.png">`

### Web-fetched images

- Fetch onto Agent's Computer via `computer_fetch_url`
- Resize so neither dimension exceeds canvas (default 1920×1080), preserve aspect ratio and format
- Command: `python3 -c "from PIL import Image; img=Image.open('in'); img.thumbnail((1920,1080),Image.LANCZOS); img.save('out',quality=85)"`
- Save into `<deck>.slides/assets/` via `save_computer_file_to_project`

### AI-generated images

- Only after per-image user confirmation (credit + time cost above average)
- Two model options exposed to me at parameter level:
  - **`gpt-image-2`** — photorealistic, in-image text (titles, labels, chart annotations, callouts), refined visual detail
  - **`nano-banana-pro`** — best for editing / extending existing images (identity/prop preservation via `image_urls`), stylized illustrations; less reliable than gpt-image-2 for legible in-image text
- Two resolutions:
  - `2k` (default) — standard slide image
  - `4k` — full-bleed hero images (>50% canvas area) or printed decks; ~4× credit cost
- Match Phase 4 photography direction

### Absolute rules

- **Never invent brand logos, competitor logos, or headshots.** Text lockup or placeholder only.
- **Resize before saving** — oversized images slow preview + break exports.
- **Copy targeted assets, not bulk folders.**

### Failure modes

- Missing asset resize → 4MB PNG bloats deck
- Bulk-copying skill assets → project bloat
- AI-generated fake logos → misleading

---

## Task A8 — Charts and data visualization

### Chart libraries

- **Chart.js** (CDN) — general purpose
- **ECharts** (CDN) — more complex visualizations

### Data tables

- **Real `<table>` element**, NOT chart library
- Marked `data-object-type="table"`
- PPTX export makes editable table from real `<table>` only

### Data source

- Verbatim from Phase 2 source map (research brief section or user file page)
- **Never fabricated. Never typed from memory.**
- Copy-paste from source artifact

### Chart type + framing + emphasis

- Locked in Phase 3 — Phase 5 executes, doesn't redecide

### Prompt rules

- **Paste chart data verbatim** from source artifact.
- **Real `<table>` for tables**, not chart-library-rendered tables.

### Failure modes

- Chart type changed in Phase 5 → violates Phase 3 seal
- Data typed from memory → transcription errors
- Fake table via div grid → export loses editability

---

## Task A9 — Paired verification per batch

### After each batch of 5–8 slides, run BOTH tools in parallel

| Tool | Catches | Misses |
|---|---|---|
| `check_slide_layout` | Overlaps, out-of-bounds, text overflow, broken images | Colors, contrast, composition, font fallbacks |
| `capture_slide_screenshot` | Visual bugs (color/contrast/typography/composition) | Subtle out-of-bounds, overflow inside padded shapes |

### Decision rule

A geometry flag is a real bug **only if the screenshot confirms** it looks wrong. A clean geometry report does NOT mean the slide is correct.

### Common false-positive geometry flags (do NOT fix reflexively)

| Overlap type | Usually |
|---|---|
| Text over shape | Intentional (caption on card) |
| Image behind text | Intentional (decorative backdrop) |
| Icon overlapping shape | Intentional (badge placement) |

### Real bugs to fix

- Textbox × textbox overlap confirmed visually
- Text extending past canvas edge
- Overflow inside fixed-height textbox
- Font fallback rendered ugly (screenshot only)
- Contrast too low to read (screenshot only)

### Screenshot modes

- `full_slide` — whole slide clipped to `.slide-container`
- `batch_slides` — up to 10 slides in one call
- `region` — canvas-pixel rectangle for zoom into small text

### Fix loop

1. Read both tool outputs together
2. Fix only issues both signals corroborate (or one flags clearly and the other doesn't contradict)
3. Re-run BOTH tools in parallel until clean

### Prompt rules

- **Never fix reflexively on geometry alone.** Read screenshot together.
- **Verify per batch**, not per slide (efficiency) and not only at end (misses fixable issues).
- **When a fix touches shared assets** (`chrome.css`, palette, layouts), re-verify whole deck, not just fixed slide.

### Failure modes

- Fixing intentional decorative overlays → breaks composition
- Ignoring screenshot-only issues (contrast, fonts) because geometry was clean
- Font-load failures silently ignored → deck no longer matches spec

---

## Task A10 — Handling missing brand assets

### When Phase 4 flagged missing assets

Two options per missing asset:

- **User provides now** — pause build, wait for upload
- **Placeholder + list** — build with placeholder, maintain visible placeholder list for user to resolve

### Prompt rules

- **Placeholder list visible throughout build.** Surface before Part B reflection.
- **Never fake missing assets** — no generated logos, no placeholder photos passed off as real.

---

## PART A tool inventory

| Tool | Purpose | Frequency |
|---|---|---|
| `Write` | Author slide HTML, manifest, design system files | Heavy — batched |
| `Edit` / `MultiEdit` | Revise existing slides | Per fix |
| `Read` | Re-read outline, source map, design summary | Frequent |
| `Copy` | Move assets from user upload to `assets/` | Per asset |
| `Rename` | Rarely; playlist reorder is preferred |
| `Delete` | Rarely; drafts stay in filesystem, just off playlist |
| `computer_fetch_url` | Fetch web images to Computer for resize | Per image |
| `computer_run_command` | Image resize, font processing, format conversion | Per asset |
| `save_computer_file_to_project` | Move Computer output to Project | Per asset |
| `image_generation` | AI-generated images (per-image confirmed) | Rare |
| `check_slide_layout` | Geometric verification | Per batch |
| `capture_slide_screenshot` | Visual verification | Per batch |
| `load_skill` | Install skill from catalog (if not done in Phase 4) | Once |
| `Glob` / `Grep` | Locate assets, find patterns in built slides | Occasional |

---

# PART B — REFLECTION

## Task B1 — Strategy check (vs. Phase 1)

For each slide, ask:
- Does it serve the confirmed audience?
- Does it advance the confirmed purpose?
- Is Core Message clearly communicated across the deck?

Failure → fix or cut. Don't leave "sort of relevant" slides.

---

## Task B2 — Substance check + source-traceability audit (INTERNAL)

### List every fact on final deck

- Every number, date, name
- Every quote, chart data point
- Every specific claim, every named entity

### For each: identify the source

- User material X page Y, OR
- Research artifact Z URL

### Anything without source → delete or replace

Internal step — does NOT add `[Source: X]` badges to slides unless deck style demands.

### Realizes Phase 2's hard rule

Every info point traces to a source.

### Prompt rules

- **Exhaustive audit, not spot-check.** Extract every fact programmatically if possible.
- **Automated fact extraction** — list every number, date, named entity, then check against source map.

---

## Task B3 — Structure check (Title Test)

Extract all slide titles from built deck. Read in sequence.

Do they alone tell a coherent story?

If titles read like a list of topics rather than an argument → **structure fails**. Propose title fixes.

### Common failure

Titles drafted generically in Phase 3 ("Market Overview") carried through Phase 5 unchanged. Fix by rewriting to claim-style ("Enterprise buyers pulled back in Q2").

---

## Task B4 — Surface check

For each slide:
- **Emphasis**: main point visible within 2 seconds (squint test)
- **Consistency**: matches Design Summary (density, palette, type, chrome)
- **Readability**: appropriate for delivery (back-row legible for live; fully self-explanatory for read-only)

### Squint test method

Screenshot every slide at reduced size (e.g., 400px wide) and check whether main point is still identifiable. If not, hierarchy fails.

### Prompt rules

- **Squint test on every slide**, not just spot-check.

---

## Task B5 — Anti-slop audit

Explicit check across the deck for AI-slop tropes:

- Filler content (padding slides just to hit page count)
- Decorative stats or icons that don't advance argument
- Unnecessary emoji
- Gradient backgrounds not from brand
- Rounded-corner containers with left-border accent (AI-slop tell)
- Generic stock imagery
- Made-up citations, plausible-sounding but unsourced claims

### Prompt rules

- **Explicit checklist**, run as separate pass.
- **Cheap to run**, catches subtle issues.

---

## Task B6 — Review summary

Consolidate issues by layer and present to user with per-issue [Yes/No] fix proposals.

Format:

```
REVIEW SUMMARY
──────────────────────────────────────────────
Strategy: [n issues]
  1. Slide 4 doesn't serve "persuade skeptical board" purpose —
     it's context-setting that assumes friendly audience.
     Fix by acknowledging concern first.
     Apply? [Yes / No]

Substance: [n issues]
  2. Slide 7's growth number lacks source (claim: "38% QoQ").
     Options: [A] cite source X, [B] adjust to sourced figure, [C] cut.
     Choice? [A / B / C]

Structure: [n issues]
  3. Reading titles 6-8 in sequence doesn't build — three separate
     topics.
     Propose: rewrite titles 6-8 to show progression.
     Apply? [Yes / No]

Surface: [n issues]
  4. Slides 5, 9, 11 have inconsistent chart caption placement.
     Standardize bottom-left? [Yes / No]

Anti-slop: [n issues]
  5. Slide 10 has decorative statistic not in source map
     ("87% of teams say X"). Cut? [Yes / No]
──────────────────────────────────────────────
```

Apply approved fixes → re-verify → only then declare complete.

### Prompt rules

- **Group by layer** (Strategy / Substance / Structure / Surface / Anti-slop).
- **Per-issue decisions**, not batch approval.

---

## Task B7 — Data-verify sub-agent offer (for high-stakes decks)

### Automatic offer for decks flagged high-stakes

- Board decks
- Investor pitches
- Medical / clinical
- Legal / regulatory

Ask user: "Because the deck contains many quantitative claims from an LLM, I can run a dedicated data-accuracy check that cross-verifies every number, date, name, and claim against primary sources. Would you like that?"

### If user opts in

- Dispatch separate `slides` sub-agent via `create_agent` with `slides_subagent_role="data_verify"`, `share_slides_project=true`
- Sub-agent cross-checks facts against research brief + live primary sources
- Sub-agent writes verdict file (e.g., `review/<deck>.md`) — each item PASS or FIX with evidence
- I read verdict, fix FIX items, dispatch FRESH data-verify sub-agent, iterate until clean

### Prompt rules

- **Automatic offer** for high-stakes decks, not opt-in.
- **Sub-agent edits nothing** — writes verdict only, I apply fixes.

---

## Task B8 — Handoff document

At Phase 5 exit, produce short markdown file at project root summarizing:

```
DECK HANDOFF
────────────────────────────────────────
Title: [deck title]
Delivered: [date]

Strategy Summary: [1-para]
Core Message: [1-line]

Sources used:
  - [User material list]
  - [Research brief path]
  - [Any external sources]

Design Summary: [1-para — density, source, palette]

Review fixes applied:
  - [list]

Known limitations / placeholders:
  - [any unresolved items]

Files:
  - Deck: <name>.slides/
  - Research brief: research/<topic>.md
  - Data-verify verdict: review/<name>.md (if run)
```

### Prompt rules

- **Handoff document produced at exit**, before declaring complete.
- **Reference for future iteration** — user (or a future session) can reload context from this file.

---

## PART B tool inventory

| Tool | Purpose |
|---|---|
| `capture_slide_screenshot` (batch mode) | Visual review across full deck |
| `check_slide_layout` (batch across deck) | Final geometric sanity |
| `Read` | Re-read Phase 1/2/3/4 artifacts for comparison |
| `Edit` / `MultiEdit` | Apply approved fixes |
| `unified_ask_user_question` | Review summary presentation |
| `create_agent` (`role=data_verify`) | Optional data-verify sub-agent |
| `Write` | Handoff document |

---

## Post-Phase-5 outputs

### Immediate

- Live preview (deck renders in preview pane)
- PPTX export (renders actual slides, not code-rebuilt)
- PDF export (renders actual slides)

### Optional

- Save deck as skill (reusable template for future decks)
- Podcast / audio narration generation
- Speaker notes export (only if deck included them — never added without explicit user request)

### Iteration path after handoff

- User edits directly in editor for small changes
- User asks for changes → I re-read deck first, then apply
- For full duplicate/save-as → dispatch copy sub-agent (`slides_subagent_role="copy"`) that forks byte-for-byte into new project

---

## Weaknesses & optimization opportunities

### Part A weaknesses

### W1 — Sample checkpoint skipped under pressure
**Symptom**: User says "skip sample, build all"; I comply. Visual issues at slide 15.
**Fix**: Non-skippable — acknowledge risk if user insists, but still build sample.

### W2 — Batches too small
**Symptom**: 1–2 slides per response instead of 5–8. Slow + high context overhead.
**Fix**: Enforce minimum batch size of 5 slides (except sample checkpoint).

### W3 — Verification per slide instead of per batch
**Symptom**: Runs after every slide waste cycles; runs only at end miss mid-build fixable issues.
**Fix**: Verify per batch.

### W4 — Chrome drift
**Symptom**: Even with shared CSS, chrome placement drifts subtly across slides.
**Fix**: Chrome as shared HTML snippet or CSS-only chrome via `::before` on `.slide-container`, defined once.

### W5 — No mid-build sanity screenshots
**Symptom**: Build 10 slides, never look at all 10 together until end. Cumulative drift.
**Fix**: Batch screenshot every 2–3 build batches.

### W6 — Placeholders unresolved
**Symptom**: Text placeholders left in slides, forgotten by handoff.
**Fix**: Visible placeholder list throughout build, surface before Part B.

### W7 — Image generation reflexive
**Symptom**: Generate custom image when placeholder or real photo would work.
**Fix**: Per-image confirmation. Ask: placeholder / real photo / AI-generated.

### W8 — Chart data typed from memory
**Symptom**: Re-typing chart data introduces transcription errors.
**Fix**: Paste verbatim from source artifact.

### W9 — Editor contract violations from over-nesting
**Symptom**: Data-object containing data-objects. Breaks editor.
**Fix**: Hard-lint each slide before finishing.

### W10 — Font-load failures silent
**Symptom**: Brand font fails to load, browser default fires, screenshot may still look OK. Deck no longer matches spec.
**Fix**: Explicit font-loaded check; surface fallback firing in review summary.

### W11 — Manifest / filesystem drift
**Symptom**: Slide file added without playlist update, or playlist entry without file.
**Fix**: Consistency check at Part A exit — every playlist entry has file; every file is in playlist or documented as draft.

### W12 — Motion drifts in
**Symptom**: I add motion because Phase 4 didn't lock it.
**Fix**: Enforce Phase 4 motion decision.

### Part B weaknesses

### W13 — Reflection skipped when user impatient
**Symptom**: "Looks great, ship it" → I accept, skip reflection.
**Fix**: Non-negotiable. Run 6 checks internally, surface briefly, let user decide fixes.

### W14 — Squint test casual
**Symptom**: Done informally, not systematically.
**Fix**: Reduced-size screenshots (400px wide) for every slide as separate audit pass.

### W15 — Source traceability rushed
**Symptom**: Spot-check instead of full audit when deck has many facts.
**Fix**: Automated fact extraction — list every number/date/named entity programmatically, check each.

### W16 — Anti-slop check inconsistent
**Symptom**: Catch some tropes, miss others.
**Fix**: Explicit anti-slop checklist as separate pass, not overlaid on surface check.

### W17 — Fix loop regresses previous slides
**Symptom**: Fix to slide 7 touches shared CSS, breaks slides 3 and 12; only re-verify slide 7.
**Fix**: When fix touches shared assets, re-verify whole deck.

### W18 — Data-verify under-offered
**Symptom**: High-stakes deck ships without data-verify offered.
**Fix**: Automatic offer for board / investor / medical / legal / regulatory decks.

### W19 — Review summary too dense
**Symptom**: 8 issues presented at once → user rubber-stamps or fights all.
**Fix**: Group by layer, present layer-by-layer with per-issue decisions.

### W20 — No handoff document
**Symptom**: User has deck but no summary; context lost on future iteration.
**Fix**: Handoff document at Phase 5 exit.

### W21 — Version filenames created
**Symptom**: I create `-v2` files instead of editing in place.
**Fix**: Edit in place — history is preserved by project versioning automatically.

### W22 — No delivery-format check at handoff
**Symptom**: Deck designed for live talk; user asks to export PDF for email; density is wrong.
**Fix**: At reflection exit, confirm intended delivery format(s), warn if density mismatches secondary format.

### W23 — Post-handoff edits destabilize
**Symptom**: User edits directly in editor; my mental model goes stale; next request uses wrong state.
**Fix**: Re-read deck before any post-handoff edit.

---

## The layered rollback rule (critical in Phase 5)

Throughout Phase 5, when a downstream task reveals an upstream gap:

- **Structural issue** → STOP, return to Phase 3, re-outline, resume
- **Content gap (missing source)** → STOP, return to Phase 2, gather, resume
- **Visual issue** → revise Phase 4 spec, don't improvise
- **Strategic drift** → return to Phase 1, re-align, cascade forward

**Never improvise upstream decisions mid-build.**

---

## Why Phase 5 quality depends on Phases 1–4

- Sealed outline (Phase 3) → I know exactly what to build
- Sealed design system (Phase 4) → I know exactly how to build it
- Sourced material (Phase 2) → I know exactly what content to place
- Locked strategy (Phase 1) → I know why each slide exists

Solid Phases 1–4 → Phase 5 is 60% authoring + 30% verification + 10% reflection. Fast, clean.

Rushed Phases 1–4 → Phase 5 is 30% authoring + 30% gap discovery + 30% upstream rework + 10% reflection. Slow, chaotic.

**The single biggest Phase 5 optimization is to have done Phases 1–4 properly.**
