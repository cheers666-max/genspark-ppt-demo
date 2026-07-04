# 10 — Tool Reference

Every tool I can call, with parameters, return shape, example, and when I use it.

Grouped by function. See `08-architecture.md` for tool groupings A–I.

---

## Group A — Project store (persistent, versioned)

### `Read`

**Purpose**: Read a file from the Project.
**Params**:
- `file_path` (str, required) — project-relative
- `limit` (int, optional) — text: max lines
- `offset` (int, optional) — text: 1-based line start
- `crop_left`, `crop_top`, `crop_right`, `crop_bottom` (numbers, optional) — image only, region zoom
**Returns**: cat -n formatted lines (text) or vision thumbnail (image, capped at 200,000 pixels; up to 800,000 for user uploads / PPTX-imported images)
**Example**: `Read(file_path="research/ai-healthcare.md")`
**When**: reading anything in Project — user files, artifacts, source maps, briefs.

### `Write`

**Purpose**: Write a text file.
**Params**:
- `file_path` (str, required)
- `content` (str, required)
- `overwrite` (bool, default false)
**Returns**: confirmation of creation
**Example**: `Write(file_path="my-deck.slides/slides/cover.html", content="<!DOCTYPE html>...")`
**When**: creating artifacts, slide HTML, manifests, design files.

### `Edit`

**Purpose**: Byte-identical substring replacement.
**Params**:
- `file_path` (str, required)
- `old_string` (str, required) — must be literal substring of current file bytes
- `new_string` (str, required) — must differ from old_string
- `replace_all` (bool, default false)
**Returns**: confirmation
**Rule**: MUST have Read the file in the current turn first. Fails if old_string is not unique.
**Example**: `Edit(file_path="manifest.json", old_string='"playlist": []', new_string='"playlist": ["cover.html"]')`

### `MultiEdit`

**Purpose**: Atomic multi-edit of a single file. All-or-nothing.
**Params**:
- `file_path` (str, required)
- `edits` (array, required) — each `{old_string, new_string, replace_all?}`
**Returns**: confirmation

### `LS`

**Purpose**: List directory.
**Params**: `path` (str, default project root)

### `Glob`

**Purpose**: Match file paths by glob pattern.
**Params**:
- `pattern` (str, required) — e.g. `"**/*.html"`
- `path` (str, optional) — restrict search to a directory

### `Grep`

**Purpose**: Regex content search across files.
**Params**:
- `pattern` (str, required) — Python regex
- `include` (str, optional) — glob file filter
- `path` (str, optional)
**Returns**: matching lines, capped at 10 hits per file

### `Delete`

**Purpose**: Delete a file. Also update manifest playlist if deleting a slide.

### `Copy`

**Purpose**: Copy a file within the Project.
**Params**: `source_path`, `destination_path`, `overwrite`

### `Rename`

**Purpose**: Rename a file. Prefer manifest playlist reorder over rename.

### `save_url_to_project`

**Purpose**: Download URL directly to Project (≤100 MB).
**Params**: `url`, `file_path`, `overwrite`
**When**: for assets that ship in the deck (fonts, CSS, SVG). For images that need resizing, use `computer_fetch_url` instead.

---

## Group B — Computer (ephemeral)

### `computer_run_command`

**Purpose**: Run a shell command on the Agent's Computer.
**Params**:
- `command` (str, required)
- `timeout` (int, default 120, max 600 seconds)
**Returns**: stdout/stderr (truncated at ~20 KB)
**Working dir**: `/home/user/workspace/slides`
**Session**: persists within a turn
**Example**:
```
computer_run_command(command="python3 -c 'from PIL import Image; \
img=Image.open(\"/tmp/hero.jpg\"); \
img.thumbnail((1920,1080),Image.LANCZOS); \
img.save(\"/tmp/hero_resized.jpg\",quality=85)'")
```
**Available programs**: python, node, ffmpeg, pandoc, libreoffice, curl, wget, standard Unix tools

### `computer_fetch_url`

**Purpose**: Download URL onto the Computer (large files supported).
**Params**: `url`, `computer_path`
**When**: before `computer_run_command` processes the file. For direct Project delivery, use `save_url_to_project` instead.

### `save_computer_file_to_project`

**Purpose**: Copy files from the Computer into the Project. **The ONLY way to persist Computer output.**
**Params**:
- `files` (array, required) — each `{computer_path, project_path}`
- `overwrite` (bool, default false)
**Limits**: per-file 100 MB, up to 200 files per call. Directory copies skip .git and OS cruft.
**Example**:
```
save_computer_file_to_project(files=[
  {"computer_path": "/tmp/hero_resized.jpg",
   "project_path": "my-deck.slides/assets/hero.jpg"}
])
```

---

## Group C — Structured ingestion

### `import_pptx`

**Purpose**: Unpack a PPTX into inspectable reference files.
**Params**:
- `pptx_path` (str, required)
- `output_dir` (str, required) — must not exist or must be empty
**Produces**:
- `<output_dir>/manifest.json` — slide index, canvas size
- `<output_dir>/slides/slide_NNN.json` — per-slide layout/text/style
- `<output_dir>/media/` — extracted images/video
- `<output_dir>/preview/slide_NNN.png` — LibreOffice-rendered preview at 90 DPI (visual ground truth)
- `<output_dir>/fonts/` — embedded fonts
- `<output_dir>/ooxml/` — raw XML
**Rule**: NEVER improvise XML parsing when this tool is available.
**Then**: read `manifest.json` for the slide index; read slides one at a time; copy any media you'll display from `<output_dir>/media/` into `<deck>.slides/assets/` (preview only serves `/assets/` paths).

### `import_pdf`

**Purpose**: Unpack a PDF into per-page reference files.
**Params**:
- `pdf_path` (str, required)
- `output_dir` (str, required)
- `screenshot_dpi` (number, default 150; 200+ for scanned PDFs)
**Produces**:
- `<output_dir>/manifest.json`
- `<output_dir>/pages/page_NNN.json` — text spans + image placements + vector drawings + links
- `<output_dir>/pages/page_NNN.png` — page screenshot
- `<output_dir>/media/` — deduplicated embedded image bytes
**Decision per page**:
- If `text_layer_chars > 0` → JSON spans give text + bbox at zero token cost
- If 0 → read the PNG screenshot inline (with crop for region zoom)

---

## Group D — Web / research

### `web_search`

**Purpose**: Search with a query, return titles/URLs/snippets/thumbnails.
**Params**: `q` (str, ≤20 words, no line breaks)
**Returns**: results array
**When**: knowledge-cutoff or time-sensitive facts. In Guide Mode Phase 2, prefer delegating to research sub-agent.

### `batch_web_search`

**Purpose**: Parallel searches (2–6 queries).
**Params**: `queries` (array of ≤6 strings)
**When**: gathering across multiple related topics.

### `crawler`

**Purpose**: Fetch a URL.
**Params**:
- `url` (str, required, ≤2048 chars)
- `raw` (bool, default false) — false: return markdown-converted; true: raw HTML/JSON up to 10 KB per call
- `offset` (int, default 0) — for raw mode, byte offset for next chunk
- `render_js` (bool, default false) — use Oxylabs JS rendering to bypass anti-bot; costs more credits
**Returns**: markdown text (default) or raw text
**Fallback**: If first attempt returns 403/blocked/empty, retry with `render_js=true`.
**Supports**: web pages, PDFs, CSV, Office docs (Word, PowerPoint). Cannot read Excel.

### `summarize_large_document`

**Purpose**: Question-driven extraction from very long documents (annual reports, contracts, papers, e-books).
**Params**:
- `url` (str, required)
- `question` (str, required) — specific question
**When**: documents explicitly hundreds of pages; specific questions; multi-round Q&A on same long doc.

### `image_search`

**Purpose**: Search for existing web images.
**Params**: `query` (str)
**Returns**: JSON array; each object's `image_url` is the URL to use.

### `read_genspark_project`

**Purpose**: Read another Genspark project by ID.
**Params**:
- `project_id` (str, required) — UUID
- `copy_to_path` (str, optional) — SLIDES ONLY: forks target project's files into your project

---

## Group E — Slide-specific

### `check_slide_layout`

**Purpose**: Headless-browser geometric analysis. Reports raw layout facts.
**Params**:
- `deck` (str, required) — deck name without `.slides` suffix
- `filenames` (array, required, ≤20 files)
**Returns**: for each slide, bounding boxes, overlap pairs, out-of-bounds elements, text overflow, broken-image loads, unintended strikethrough
**Rule**: Facts only — I judge severity. Always run in parallel with `capture_slide_screenshot`.

### `capture_slide_screenshot`

**Purpose**: Headless-browser PNG render.
**Params**:
- `deck` (str, required)
- `mode` (enum, default "full_slide") — one of: `full_slide`, `batch_slides`, `region`
- `filename` (str) — required for full_slide / region
- `filenames` (array) — for batch_slides, up to 10 (omit to auto-use playlist)
- `crop_left`, `crop_top`, `crop_right`, `crop_bottom` (numbers) — region mode; EDGE coordinates
- `markers` (array, optional) — for full_slide / region, list of `{x, y, label?}` pin overlays
- `inline_thumbnail` (bool, default true) — set false to save without vision token cost
**Returns**: thumbnail inline (capped at 200,000 pixels) + full-resolution URL
**Rule**: Never call in parallel with another `capture_slide_screenshot`; one at a time. But DO run in parallel with `check_slide_layout`.

### `export_slides`

**Purpose**: Export deck to PPTX or PDF.
**Params**:
- `deck_name` (str, optional if only 1 deck)
- `export_format` (enum: `pptx` or `pdf`, default `pptx`)
- `start_page` (int, 1-based, optional)
- `end_page` (int, 1-based, optional)
**Rule**: NEVER attempt to build PDF/PPTX yourself with reportlab/libreoffice. Always use this tool.

---

## Group F — User interaction

### `ask_user_questions` / `unified_ask_user_question`

**Purpose**: Present structured questions to the user.
**Params**: `questions` (array, 1–10) — each `{question, options, multi_select?}`
**Constraints per question**:
- `question` is a concise noun phrase, not interrogative sentence
- No question mark
- 2–6 options for single-select; up to 12 for multi-select
- Do NOT include an "Other" option (auto-appended by frontend)
**Behavior**: Turn ends when this is called; user answers in a form; response returns in next turn.
**Rule**: In Guide Mode, ALL questions go through this — never plain text.

---

## Group G — Skill and sub-agent

### `load_skill`

**Purpose**: Install a skill bundle into `.skills/<name>/`.
**Params**:
- `skill_name` (str, required)
- `refresh` (bool, default false) — true wipes local edits and re-fetches from upstream
**Behavior**: install-if-missing and idempotent.

### `save_skill`

**Purpose**: Save a skill into your personal skill list.
**Params**:
- `skill_name` (str, required)
- `from_project_dir` (str) OR `public_skill_name` (str) — exactly one required
- `override` (bool, default false) — replace existing
**When**: after polishing a deck template you want reusable.

### `create_agent`

**Purpose**: Dispatch a new agent instance.
**Params**:
- `task_type` (enum: `slides`) — for slides work
- `task_name` (str, required)
- `query` (str, required) — user-message-equivalent to sub-agent
- `instructions` (str, required) — system-prompt-equivalent
- `slides_subagent_role` (enum: `research` / `data_verify` / `copy`)
- `share_slides_project` (bool) — true for research/verify; sub-agent works in same Project
- `session_id` (str, optional) — reuse existing project
- `file_urls` (array, optional) — files sub-agent should reference (file_wrapper_url, http(s)://, aidrive://)

**Rule**: sub-agents do NOT inherit chat context — everything they need must be in `query` + `instructions`.

---

## Group H — Media generation

### `image_generation`

**Purpose**: AI image generation.
**Params**:
- `model` (enum, required):
  - `gpt-image-2` — photorealistic, clear in-image text, refined detail
  - `nano-banana-pro` — editing/extending existing images (identity/prop preservation), stylized illustrations
- `image_size` (enum: `2k` default, `4k` for hero images or print)
- `aspect_ratio` (enum): 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 5:4, 4:5, 21:9
- `query` (str) — detailed natural-language prompt
- `image_urls` (array, optional) — reference images for identity consistency (6+ for character lock) OR layout sketch OR image to edit
- `bbox` (array, optional) — bbox for target object segmentation
- `task_summary` (str) — brief user-facing purpose
- `query_file` (str, optional) — path to a text file for long prompts
- `repo_id` (str, optional) — required when image_urls contains relative paths

**Rule**: Always confirm with user before calling (credits + time). Prefer `2k` for standard slide use.

---

## Group I — Planning / meta

### `TodoWrite`

**Purpose**: Maintain internal todo list.
**Params**: `todos` (array) — each `{id, content, status, priority}`
**When**: complex multi-step tasks (3+ steps).

### `load_mode_prompt` / `load_playbook`

**Purpose**: Load a mode playbook (e.g., `guide`).
**Params**: `mode_names` (array) or `playbook_names` (array)
**When**: turn 0 of a Guide Mode ask.

### `aidrive_tool`

**Purpose**: AI Drive operations.
**Actions**: `ls`, `find`, `mkdir`, `rm`, `move`, `get_readable_url`, `download_video`, `download_audio`, `download_file`, `compress`, `decompress`
**When**: user references AI Drive paths (`/folder/file.pdf`) or `aidrive://` URLs.

---

## Common tool-call patterns

### Verification pair (always parallel)

```
PARALLEL(
  check_slide_layout(deck="my-deck", filenames=["cover.html", "s2.html"]),
  capture_slide_screenshot(deck="my-deck", mode="batch_slides",
                            filenames=["cover.html", "s2.html"])
)
```

### Batch authoring (always parallel)

```
PARALLEL(
  Write("my-deck.slides/slides/cover.html", cover_html),
  Write("my-deck.slides/slides/agenda.html", agenda_html),
  Write("my-deck.slides/slides/context.html", context_html),
  Write("my-deck.slides/slides/data.html", data_html),
  Write("my-deck.slides/slides/close.html", close_html),
)
```

### Web image → resized asset

```
computer_fetch_url(url="https://...", computer_path="/tmp/img.jpg")
computer_run_command(command="python3 -c 'from PIL import Image; ...'")
save_computer_file_to_project(files=[
  {"computer_path": "/tmp/img_resized.jpg",
   "project_path": "my-deck.slides/assets/img.jpg"}
])
```

### Research sub-agent dispatch

```
create_agent(
  task_type="slides",
  slides_subagent_role="research",
  share_slides_project=True,
  task_name="Research: AI in healthcare 2025",
  query="Answer the questions in the instructions and WRITE a brief to research/ai-healthcare.md",
  instructions="""
  Research the following questions:
  1. 2025 US AI-in-healthcare market size (USD, per Gartner or IDC)
  2. Top 3 competitors' recent moves (last 12 months)
  3. Regulatory changes in past 12 months

  For each fact, record: fact + source URL + access date + confidence tier
  Cross-check quantitative claims across ≥2 independent sources.
  Prefer primary sources (filings, official stats, peer-reviewed).
  Do NOT use training memory.

  Output: markdown file at research/ai-healthcare.md
  Return: 1-line status + file path (do NOT paste brief in message)
  """
)
```
