# 07 — Models and Tools: What I Can and Cannot Tell You

## Read this first — the honesty statement

You asked me to list all models used at each stage. I need to be direct about what I actually have visibility into:

### What I DO see

- **The tools I can call** — I have a defined set of tools with names, parameters, and docstrings
- **The image-generation models** — because model selection is an explicit parameter I set per call (`gpt-image-2`, `nano-banana-pro`)
- **Which tool is used for which capability** — one-to-one mapping is documented in each phase file

### What I do NOT see reliably

- **Which underlying language model is running me** at any given step (i.e., what generates my responses)
- **Which language model powers each sub-agent** when I dispatch one
- **Whether different steps use different models** (e.g., planning vs. authoring vs. verification)
- **Whether tools like `check_slide_layout` or `capture_slide_screenshot` internally use ML models** or pure programmatic checks

I will NOT fabricate names to satisfy the request. If you need the actual model list, that information is on the platform side — I can't provide it truthfully from here.

What follows is an **honest capability + tool inventory** with everything I actually know, and explicit gaps where I don't.

---

## Complete tool inventory (organized by phase)

### Cross-phase (available everywhere)

| Tool | Purpose | Notes |
|---|---|---|
| `unified_ask_user_question` | Consultative questions to user | Guide Mode mandates this for ALL questions. Structured [A/B/C] options, up to 10 questions per form, single form per call. |
| `Read` | Read a file from Project | Supports text, image (with crop zoom), returns cat -n formatted lines |
| `Write` | Write a text file | Only overwrites when overwrite=true |
| `Edit` | Byte-identical string replacement | Requires exact substring match |
| `MultiEdit` | Multiple atomic edits to one file | All-or-nothing |
| `LS` | List directory | |
| `Glob` | Match file paths by pattern | |
| `Grep` | Regex content search across files | |
| `Delete` | Delete a file | Also update manifest if deleting a slide |
| `Copy` | Copy a file | |
| `Rename` | Rename a file | Prefer manifest playlist reorder over rename |

**Underlying model**: unknown — this is me (the agent). I don't have introspection into which model tier or provider runs my responses.

---

### Phase 1 — Strategy

| Tool | Model / capability |
|---|---|
| `unified_ask_user_question` | UI presentation layer; not a model |
| `Read` (of attached files) | File reader; text extraction is deterministic |

**No sub-agents dispatched in Phase 1.**

---

### Phase 2 — Substance

#### File ingestion tools

| Tool | Underlying capability | Model exposure |
|---|---|---|
| `import_pptx` | Parses PPTX ZIP, resolves OOXML layout/text/style, extracts media, renders per-slide preview PNG via LibreOffice at 90 DPI | Deterministic parsing; PNG rendering by LibreOffice (not an ML model) |
| `import_pdf` | Parses PDF, extracts text spans + image placements + page screenshots | Deterministic; screenshot rendering at configurable DPI (72–300) |
| `Read` (image with crop) | Vision analysis of images | **This IS a vision-capable model call** — but which vision model is opaque to me. Downsampled to ~200,000 pixels for thumbnail. |
| `crawler` | Fetches URL, converts to markdown (default) or returns raw HTML | Server-side conversion; can use `render_js=true` for anti-bot (Oxylabs JS rendering) |
| `summarize_large_document` | Question-driven extraction from long documents | **This IS a model call** — question-answering over long content. Model opaque. |

#### Web research tools (used by sub-agents; I can also call directly for small clarifications)

| Tool | Underlying capability |
|---|---|
| `web_search` | Query-based web search, returns titles/URLs/snippets |
| `batch_web_search` | Parallel web searches (2–6 queries) |
| `crawler` | (also usable for direct web reads) |

**Search provider**: opaque to me. Results come back structured but I don't know which search backend.

#### Research sub-agent dispatch

| Tool | Detail |
|---|---|
| `create_agent` with `slides_subagent_role="research"` | Dispatches a new `slides`-type agent instance to gather content and write a brief file |

**Sub-agent's underlying model**: opaque. I don't know if it's the same model as me or a different one. I know its BEHAVIOR is scoped by:
- `task_type=slides` (same as me)
- Role tag `research` (adjusts its default behavior)
- The instructions I pass in
- `share_slides_project=true` (works in my Project)

---

### Phase 3 — Structure

| Tool | Model / capability |
|---|---|
| `unified_ask_user_question` | UI |
| `Read` | Re-reads Phase 1 + 2 artifacts |
| `Write` | Saves outline drafts |

**No web tools, no image generation, no sub-agents in Phase 3.**

---

### Phase 4 — Surface

| Tool | Model / capability |
|---|---|
| `unified_ask_user_question` | UI |
| `load_skill` | Installs skill bundle from catalog into `.skills/<name>/` |
| `Read` | Inspects skill contents, brand guides |
| `import_pptx` / `import_pdf` | If user uploaded template |
| `Write` | Design Summary artifact |

**Skill catalog browse**: I have a listing of available skills in my context (`<available_skills>` block). I don't know exactly how that list is assembled — likely by matching against a personal + org + public gallery, but the mechanism is server-side.

**No slide creation, no image generation in Phase 4.**

---

### Phase 5 — Execution & Reflection

#### Slide authoring

| Tool | Model / capability |
|---|---|
| `Write` / `Edit` / `MultiEdit` | Author HTML files (me — the agent — writing them) |

**Underlying model** for authoring: this is me. Opaque which model tier/provider.

#### Asset processing (Agent's Computer)

| Tool | Underlying capability |
|---|---|
| `computer_run_command` | Runs shell commands on an ephemeral Linux Computer (per-session sandbox). Has Python, node, ffmpeg, pandoc, libreoffice available. Not an ML model — it's a real shell. |
| `computer_fetch_url` | Downloads URL to Computer (large files supported) |
| `save_computer_file_to_project` | Moves Computer output into Project (the ONLY way to persist) |

**No models here** — this is standard software execution.

#### Image generation

**This is the ONE place I have real model visibility, because model choice is a parameter I set.**

| Model | Best for | Cost |
|---|---|---|
| `gpt-image-2` | Photorealistic realism, clear in-image text (titles, labels, chart annotations, callouts), refined visual detail — scientific illustrations, product mockups, branded photography | Standard |
| `nano-banana-pro` | Editing / extending existing images passed via `image_urls` (preserving identity, prop, or scene across multiple slides); stylized / illustrative visuals where photorealism is not the goal | Less reliable than gpt-image-2 for legible in-image text |

**Resolutions**:
- `2k` — default, standard slide image
- `4k` — full-bleed hero images (>50% canvas area) or printed decks; ~4× credit cost

**Aspect ratios available**: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 5:4, 4:5, 21:9

**These are the only models I can name with certainty** because they're exposed to me as `model` parameter values.

#### Verification tools

| Tool | Underlying capability |
|---|---|
| `check_slide_layout` | Renders slide(s) in headless browser (Chromium likely), reports geometric facts: bounding boxes, overlap pairs, out-of-bounds, text overflow, broken image loads, unintended strikethrough. Max 20 slides per call. | **Not an ML model** — this is programmatic DOM/CSS layout analysis |
| `capture_slide_screenshot` | Renders slide in headless browser and returns PNG screenshot at canvas resolution + inline thumbnail (~200,000 pixels). Modes: `full_slide`, `batch_slides` (up to 10), `region`. Supports overlay markers. | **Not an ML model** — this is browser rendering. |

**However**, when I then *analyze* the screenshot in my response, that analysis IS a vision-model call (me looking at the returned image). The screenshot generation is deterministic; the interpretation is model-based.

#### Sub-agent dispatch (Phase 5)

| Tool | Role tags I can set |
|---|---|
| `create_agent` (`slides_subagent_role="data_verify"`) | Cross-checks facts against sources, writes PASS/FIX verdict file |
| `create_agent` (`slides_subagent_role="copy"`) | Byte-for-byte forks a source deck into a new Project |

**Sub-agent underlying models**: opaque.

#### Export

| Tool | Underlying capability |
|---|---|
| `export_slides` (format=pptx or pdf) | Renders actual slides (not a code rebuild) and produces downloadable file. |

**Not an ML model** — this is deterministic browser render + format conversion.

---

## Complete list of tools I can call

Grouped for reference:

### Project file management (persistent — visible to user)
`Read`, `Write`, `Edit`, `MultiEdit`, `LS`, `Glob`, `Grep`, `Delete`, `Copy`, `Rename`, `save_url_to_project`

### Computer file management (temporary — invisible to user)
`computer_run_command`, `computer_fetch_url`, `save_computer_file_to_project`

### Structured content ingestion
`import_pptx`, `import_pdf`

### Web / research
`web_search`, `batch_web_search`, `crawler`, `summarize_large_document`, `read_genspark_project`

### User interaction
`ask_user_questions`, `unified_ask_user_question` (Guide Mode preferred)

### Slide-specific
`check_slide_layout`, `capture_slide_screenshot`, `export_slides`

### Image
`image_search`, `image_generation`

### Skill management
`load_skill`, `save_skill`

### Sub-agent dispatch
`create_agent` with role tags: `research`, `data_verify`, `copy`

### Planning / tracking
`TodoWrite`, `load_mode_prompt`

### AI Drive (external storage)
`aidrive_tool` (ls/find/mkdir/rm/move/get_readable_url/download_*/compress/decompress)

---

## What I would need to answer your model question fully

To provide the model-per-stage table you originally asked for, someone with platform visibility would need to expose:

1. **Which language model runs me** (the primary agent) at each stage — whether it's uniform across all phases or tiered (e.g., cheaper for planning, better for authoring)
2. **Which language model runs each sub-agent role** (research / data_verify / copy) — likely the same as me, but I can't confirm
3. **Which vision model backs `Read` on images and `capture_slide_screenshot` analysis** — the returned thumbnail's vision analysis
4. **Which model backs `summarize_large_document`** — question-answering over long PDFs
5. **Which search backend powers `web_search` / `batch_web_search`**
6. **Which JS-rendering service powers `crawler` with `render_js=true`** (documented as Oxylabs)

The image generation models (`gpt-image-2`, `nano-banana-pro`) are the only ones I can name with confidence because they're parameters, not opaque backends.

---

## Table: capability × stage × exposure

This is the most honest version of the model-per-stage table I can produce:

| Stage | Capability | Tool | Underlying model exposure |
|---|---|---|---|
| Phase 1 | Consultation | `unified_ask_user_question` | UI |
| Phase 1 | File read | `Read` | Deterministic (text) / vision-model (images, opaque) |
| Phase 2 | PPTX ingest | `import_pptx` | Deterministic parsing + LibreOffice preview |
| Phase 2 | PDF ingest | `import_pdf` | Deterministic parsing + rendering |
| Phase 2 | Web crawl | `crawler` | Server-side, optional Oxylabs JS render |
| Phase 2 | Web search | `web_search` / `batch_web_search` | Server-side (backend opaque) |
| Phase 2 | Long doc Q&A | `summarize_large_document` | Model-backed (opaque) |
| Phase 2 | Research delegation | `create_agent` (role=research) | Sub-agent LLM (opaque) |
| Phase 3 | Consultation | `unified_ask_user_question` | UI |
| Phase 3 | Draft writing | `Write` | Me (opaque) |
| Phase 4 | Skill load | `load_skill` | File fetch |
| Phase 4 | Consultation | `unified_ask_user_question` | UI |
| Phase 5-A | HTML authoring | `Write`, `Edit`, `MultiEdit` | Me (opaque) |
| Phase 5-A | Computer ops | `computer_run_command` | Real shell (Python, Node, ffmpeg, LibreOffice) |
| Phase 5-A | Image search | `image_search` | Server-side (backend opaque) |
| Phase 5-A | Image generation | `image_generation` | **`gpt-image-2` OR `nano-banana-pro`** (my choice) |
| Phase 5-A | Geometric verify | `check_slide_layout` | Headless browser (Chromium-based likely; not ML) |
| Phase 5-A | Screenshot | `capture_slide_screenshot` | Headless browser rendering (not ML); my later analysis is vision-model |
| Phase 5-B | Data verify sub-agent | `create_agent` (role=data_verify) | Sub-agent LLM (opaque) |
| Phase 5-B | Copy sub-agent | `create_agent` (role=copy) | Sub-agent LLM (opaque) |
| Export | PPTX / PDF | `export_slides` | Browser render + format conversion (not ML) |

---

## Why this matters for optimization

If you want to identify system vulnerabilities related to models:

- **Model opacity for the primary agent (me)** is itself a vulnerability — you can't A/B test model swaps or evaluate per-phase quality contribution if you can't see what's running each phase
- **Sub-agent model opacity** is similar — research quality depends on that model's tool-use quality, but you can't optimize what you can't see
- **Vision analysis on screenshots** is the only ML-backed verification step — if that vision model is weaker than expected, my Phase 5 reflection catches fewer visual bugs

If any of these matter for your review, the platform-side team is who to ask. Anything more specific I could tell you here would be a fabrication.

---

## Where to look for optimization opportunities related to models/tools

1. **Standardize sub-agent instructions** (see `06-prompt-mechanism.md` W17) — regardless of which model runs sub-agents, better instructions = better output
2. **Image generation prompt templating** (W22) — model quality is fixed; prompt discipline is the lever
3. **Vision-analysis reliance** — Phase 5 Part B depends on my reading the screenshots. If model has weak vision, the squint test and anti-slop audit degrade
4. **Verification tool pairing** — the *combination* of geometric (deterministic) + screenshot (vision-model) is stronger than either alone. Don't rely on one.
