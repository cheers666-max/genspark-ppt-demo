# 08 — System Architecture

This document describes the overall architecture of the slide-authoring system: the layers, their boundaries, the data that flows between them, and where state lives.

---

## Top-level architecture

The system is composed of **five distinct surfaces** that never share memory directly — they communicate only through explicit interfaces (files, tool calls, or process dispatch).

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER LAYER                               │
│  ┌──────────────────┐         ┌────────────────────────────┐   │
│  │   Chat panel     │         │   Preview panel            │   │
│  │  (left side)     │         │  (right side, toggles      │   │
│  │  - User input    │         │   between rendered slides  │   │
│  │  - Agent replies │         │   and file browser)        │   │
│  │  - Question tool │         │  - Reads from Project only │   │
│  │    forms         │         │  - Live-updates on Project │   │
│  └──────────────────┘         │    writes                  │   │
│                               └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
             ▲                                    ▲
             │                                    │
             ▼                                    │
┌────────────────────────────────┐                │
│         AGENT LAYER            │                │
│  (this is me — the primary     │                │
│   LLM running Guide Mode)      │                │
│                                │                │
│  Context assembly:             │                │
│  - Base system prompt          │                │
│  - Mode overlay (Guide)        │                │
│  - User messages               │                │
│  - Attached files              │                │
│  - Memory recall (opaque)      │                │
│  - Tool descriptions           │                │
│                                │                │
│  Emits: tool calls, replies    │                │
└────────────────────────────────┘                │
             │                                    │
             │ tool dispatch                      │
             ▼                                    │
┌─────────────────────────────────────────────────┴───────────────┐
│                     TOOL LAYER                                  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ Project store   │  │ Computer        │  │ Sub-agent      │  │
│  │ (persistent,    │  │ (ephemeral      │  │ dispatch       │  │
│  │  git-backed)    │  │  Linux sandbox) │  │                │  │
│  │                 │  │                 │  │ - research     │  │
│  │ - Read/Write    │  │ - shell / python│  │ - data_verify  │  │
│  │ - LS/Glob/Grep  │  │ - ffmpeg / etc  │  │ - copy         │  │
│  │ - Edit/Copy/    │  │ - fetch URL     │  │                │  │
│  │   Rename/Delete │  │ - save→Project  │  │                │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ Web / research  │  │ Slide-specific  │  │ Media / gen    │  │
│  │                 │  │                 │  │                │  │
│  │ - web_search    │  │ - check_slide_  │  │ - image_gen    │  │
│  │ - batch_search  │  │     layout      │  │ - image_search │  │
│  │ - crawler       │  │ - capture_slide_│  │                │  │
│  │ - summarize     │  │     screenshot  │  │                │  │
│  │   _large_doc    │  │ - export_slides │  │                │  │
│  │                 │  │ - import_pptx   │  │                │  │
│  │                 │  │ - import_pdf    │  │                │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │ User interaction│  │ Skill manager   │                      │
│  │                 │  │                 │                      │
│  │ - ask_user_     │  │ - load_skill    │                      │
│  │   questions     │  │ - save_skill    │                      │
│  └─────────────────┘  └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
             │
             │ writes/reads
             ▼
┌────────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                               │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Project filesystem (persistent, versioned per turn)     │ │
│  │                                                          │ │
│  │  Root/                                                   │ │
│  │  ├─ <deck-1>.slides/       ← user-visible                │ │
│  │  │   ├─ manifest.json                                    │ │
│  │  │   ├─ slides/*.html                                    │ │
│  │  │   └─ assets/**                                        │ │
│  │  ├─ <deck-2>.slides/                                     │ │
│  │  ├─ .guide/                ← internal (Guide Mode)       │ │
│  │  │   ├─ strategy-summary.md                              │ │
│  │  │   ├─ source-map.md                                    │ │
│  │  │   ├─ outline-draft-N.md                               │ │
│  │  │   ├─ design-summary.md                                │ │
│  │  │   └─ kill-list.md                                     │ │
│  │  ├─ research/              ← research briefs             │ │
│  │  │   └─ <topic>.md                                       │ │
│  │  ├─ review/                ← data-verify verdicts        │ │
│  │  │   └─ <deck>.md                                        │ │
│  │  ├─ .skills/               ← installed skills            │ │
│  │  │   └─ <skill>/**                                       │ │
│  │  └─ process-docs/          ← this documentation          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Computer filesystem (ephemeral, per session)            │ │
│  │  /home/user/workspace/slides                             │ │
│  │  - Working copy of the Project (auto-refreshed at boot) │ │
│  │  - /tmp for scratch work                                 │ │
│  │  - Reclaimed after task or ~1hr inactivity               │ │
│  │  - INVISIBLE to preview panel                            │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## Layer 1 — User layer

### Chat panel (left)

- Renders user text input
- Renders my replies as messages
- Renders question-tool forms (user answers → I receive as text)
- Renders tool-call badges (short status like "Writing cover slide")

### Preview panel (right)

- Toggles between **rendered slides** and **project folder view**
- Rendered slides: iframes each slide's HTML at declared canvas dimensions, letterboxed to fit viewport
- Folder view: browsable read of the Project filesystem
- **Reads ONLY from Project store** — Computer filesystem is invisible
- Live-updates whenever Project files change

### Contract

- Chat panel is my primary output channel to the user
- Preview panel is a read-only view of what I produce in the Project
- I never manipulate the preview directly; I manipulate Project files

---

## Layer 2 — Agent layer

This is **me** — the primary LLM instance handling this conversation.

### Context assembly (what's in my "brain" each turn)

Each turn, my working context is assembled from:

1. **Base system prompt** — global behavior rules (editor contract, anti-slop, grounding, tool usage)
2. **Mode overlay** — Guide Mode's 5-phase playbook, execution gate, question tool mandate
3. **User's message this turn**
4. **Full chat history** (user + agent messages from earlier turns)
5. **Tool descriptions** — the callable set of tools with parameters and docstrings
6. **Available skills list** — `<available_skills>` block with personal + org skills
7. **Memory recall (opaque)** — system-provided context from memory system, if any
8. **Manifest consistency notice** (if playlist ↔ files have drifted)
9. **Attached files** — surfaced by user, referenced via tool calls

### Output modes

Every turn I produce one of:
- **Plain text reply** to user (chat panel)
- **Tool call(s)** — one or many, parallel or sequential
- **Both** — text reply that also invokes tools

### What I do NOT control

- Which underlying model runs me (opaque)
- Memory system contents (opaque; I use silently)
- Preview panel rendering (server-side)
- Sub-agent internals once dispatched (isolated)

---

## Layer 3 — Tool layer

Tools are how I interact with everything outside my own reasoning. They fall into six functional groups:

### Group A — Project store tools

Persistent, versioned filesystem operations. Every tool call here creates a commit.

| Tool | Operation |
|---|---|
| `Read` | Read text or image file |
| `Write` | Create or overwrite (with flag) a text file |
| `Edit` | Byte-identical substring replacement |
| `MultiEdit` | Atomic multi-edit |
| `LS` | List directory |
| `Glob` | Pattern match paths |
| `Grep` | Regex search across files |
| `Copy` | Copy a file |
| `Rename` | Rename a file |
| `Delete` | Delete a file |
| `save_url_to_project` | Download URL directly into Project |

### Group B — Computer tools

Ephemeral Linux sandbox for running programs. State does not persist beyond ~1 hour of inactivity.

| Tool | Operation |
|---|---|
| `computer_run_command` | Execute shell (python / node / ffmpeg / libreoffice / etc.) |
| `computer_fetch_url` | Download URL to Computer for processing |
| `save_computer_file_to_project` | Move Computer output into Project (**the ONLY path**) |

### Group C — Structured ingestion

Deterministic parsers that turn user-supplied binaries into structured inspectable data.

| Tool | Operation |
|---|---|
| `import_pptx` | Unpack PPTX → per-slide JSON + media + preview PNGs |
| `import_pdf` | Unpack PDF → per-page JSON (text spans + image positions) + page screenshots |

### Group D — Web / research

Read external web content.

| Tool | Operation |
|---|---|
| `web_search` | Query-based search, returns results |
| `batch_web_search` | Parallel searches (2–6 queries) |
| `crawler` | Fetch URL, return markdown (default) or raw (10 KB per call) |
| `summarize_large_document` | Question-driven extraction from long PDFs/docs |
| `image_search` | Search for existing web images |

### Group E — Slide-specific

Operations only meaningful for slide decks.

| Tool | Operation |
|---|---|
| `check_slide_layout` | Headless-browser geometric analysis |
| `capture_slide_screenshot` | Headless-browser PNG render (full_slide / batch_slides / region) |
| `export_slides` | Render deck → PPTX or PDF |

### Group F — User interaction

Structured question forms.

| Tool | Operation |
|---|---|
| `ask_user_questions` | Present ordered questions with options; user fills form |
| `unified_ask_user_question` | (Guide Mode preferred variant) |

### Group G — Skill and sub-agent management

| Tool | Operation |
|---|---|
| `load_skill` | Install skill bundle into `.skills/<name>/` |
| `save_skill` | Publish a skill from a folder |
| `create_agent` | Dispatch a new agent instance (with role tag) |

### Group H — Media generation

| Tool | Operation |
|---|---|
| `image_generation` | AI image generation (models: `gpt-image-2`, `nano-banana-pro`) |

### Group I — Planning / meta

| Tool | Operation |
|---|---|
| `TodoWrite` | Maintain internal todo list |
| `load_mode_prompt` | Load a mode playbook (like `guide`) |
| `read_genspark_project` | Read another project by ID |

---

## Layer 4 — Storage layer

Two distinct filesystems, each with different persistence and visibility guarantees.

### Project store (persistent, versioned)

- **Persistence**: forever, versioned per turn (every tool call that mutates creates a commit)
- **Visibility**: user sees everything here through preview panel
- **Access**: via Group A + Group C tools
- **Structure**: everything under project root, with `<deck>.slides/` folders being user-visible decks
- **Size**: no hard cap surfaced, but individual files ≤ 100 MB

### Computer filesystem (ephemeral)

- **Persistence**: only for current session (~1 hour of inactivity)
- **Visibility**: NOT visible to user via preview
- **Access**: via Group B tools
- **Working directory**: `/home/user/workspace/slides` (auto-cloned from Project at boot)
- **Purpose**: run programs (Python, ffmpeg, LibreOffice), inspect binaries, process assets

### The Project ↔ Computer sync boundary

**Critical distinction that governs all execution**:

- Bytes written to Project via Group A tools are immediately reflected in the preview
- Bytes written to Computer via Group B tools are INVISIBLE to preview
- Only `save_computer_file_to_project` moves bytes from Computer → Project
- Any git push from Computer to Project is rejected — the only path is `save_computer_file_to_project`
- End-of-turn: anything left only on the Computer is discarded

**Never leave user-visible output only on the Computer.**

---

## Sub-agent architecture

Sub-agents are separate agent instances dispatched via `create_agent`. They run in isolation and communicate with me only through:

- **Instructions** I pass at dispatch (their system-level task brief)
- **Query** I pass at dispatch (their user-message equivalent)
- **Shared Project filesystem** (if `share_slides_project=true`) — they can read/write the same Project I can
- **Returned message** when they finish (typically 1-line status + file path)

### Sub-agent roles used in this system

| Role | Purpose | Writes | Reads |
|---|---|---|---|
| `research` | Web research, write sourced brief | `research/<topic>.md` | Public web via web_search/crawler |
| `data_verify` | Cross-check facts on built deck | `review/<deck>.md` (verdict, PASS/FIX) | Deck HTML + research briefs |
| `copy` | Fork a source deck byte-for-byte into new project | New project's files | Source project's files |

### Isolation properties

- Sub-agents do NOT inherit my chat context — they see only what I put in `instructions` and `query`
- Sub-agents run their own tool loop until they return
- Sub-agent's underlying LLM model is opaque to me
- Sub-agents cannot dispatch further sub-agents (or can they? Not documented — I assume not)

---

## Data flow: end-to-end deck build

```
USER MSG
   │
   ▼
[Agent] Context assembly
   │   (base prompt + mode overlay + history + user msg)
   ▼
[Agent] Classify + reason
   │
   ▼
[Tool] ask_user_questions ─── (Phase 1)
   │   User answers via form
   ▼
[Agent] Reason + build Strategy Summary
   │
   ▼
[Tool] Write .guide/strategy-summary.md ─── (Phase 1 exit)
   │
   ▼
[Tool] ask_user_questions ─── (Phase 2 sub-flow)
   │
   ▼
[Tool] Read/import_pptx/import_pdf on attached materials
   │
   ▼
[Tool] create_agent (role=research)
   │   ├─→ Sub-agent runs web_search/crawler/etc.
   │   └─→ Sub-agent writes research/<topic>.md
   ▼
[Tool] Read research/<topic>.md ─── (verify quality)
   │
   ▼
[Tool] Write .guide/source-map.md ─── (Phase 2 exit)
   │
   ▼
[Tool] ask_user_questions ─── (Phase 3, section-by-section)
   │
   ▼
[Tool] Write .guide/outline-draft-N.md ─── (Phase 3 exit)
   │
   ▼
[Tool] ask_user_questions ─── (Phase 4)
   │
   ▼
[Tool] load_skill (if source B)
[Tool] Read (brand assets)
   │
   ▼
[Tool] Write .guide/design-summary.md ─── (Phase 4 exit)
                                          ═════════════════
                                          EXECUTION GATE
                                          NOW OPEN
                                          ═════════════════
[Tool] Write <deck>.slides/manifest.json (playlist-first)
[Tool] Write <deck>.slides/assets/chrome.css
[Tool] Copy brand assets → assets/
   │
   ▼
[Tool] Write cover.html + 1-2 sample layouts
[Tool] check_slide_layout (parallel) + capture_slide_screenshot (parallel)
   │
   ▼
[Tool] ask_user_questions ─── (SAMPLE CHECKPOINT)
   │   Approved
   ▼
[Tool] Write slide-N.html × batches of 5-8 (parallel)
[Tool] check_slide_layout + capture_slide_screenshot (parallel) per batch
   │   Loop until all slides built + verified
   ▼
[Tool] Reflection: capture_slide_screenshot (batch_slides mode)
[Agent] Run 6-check self-review internally
   │
   ▼
[Tool] ask_user_questions ─── (review summary)
[Tool] Edit/MultiEdit (approved fixes)
[Tool] Re-verify affected slides
   │
   ▼
[Tool] (Optional) create_agent (role=data_verify)
   │   └─→ Sub-agent writes review/<deck>.md
   ▼
[Tool] Read review/<deck>.md
[Tool] Edit (fix FIX items)
[Tool] Re-dispatch data-verify (fresh sub-agent) until clean
   │
   ▼
[Tool] Write handoff-notes.md
   │
   ▼
[Agent] Announce completion
```

---

## State and where it lives

At any point during the build, "state" is distributed across:

| State | Location | Persistence |
|---|---|---|
| User's requirements | Chat history + `.guide/strategy-summary.md` | Persistent (history is turn-preserved; file is versioned) |
| Sourced material | Attached files + `research/*.md` | Persistent |
| Deck outline | `.guide/outline-draft-N.md` | Persistent |
| Visual system | `.guide/design-summary.md` + `<deck>.slides/assets/*` | Persistent |
| Slide bodies | `<deck>.slides/slides/*.html` | Persistent |
| Playlist order | `<deck>.slides/manifest.json` | Persistent |
| My working memory of state | Agent context | Ephemeral (each turn re-assembled) |
| Sub-agent working memory | Their context | Ephemeral (they die when they finish) |
| Computer working state | `/home/user/workspace/slides` and `/tmp` | Ephemeral (die with Computer) |

**Design principle**: any state that must survive beyond one turn lives in the Project store. Anything else is ephemeral by design.

---

## Concurrency model

### Within a turn

- Multiple independent tool calls can be **parallelized** in a single tool block
- Example: `check_slide_layout` + `capture_slide_screenshot` on the same slides run in parallel
- Sequential is only when there's a data dependency (need file A's contents to write file B)

### Across turns

- Turns are strictly sequential — one turn completes fully before the next begins
- User's next message triggers the next turn
- Question tool ends a turn — the tool blocks and my turn ends until user answers

### Sub-agent concurrency

- Multiple sub-agents can be dispatched in a single turn if they're independent
- Sub-agents can run in parallel with my other tool calls
- Sub-agents complete asynchronously — I receive their return when they finish
- If a sub-agent takes long (research over many URLs), it may span into the next agent turn — I can proceed with other work in the meantime

---

## Failure modes and fallbacks

| Failure | Fallback |
|---|---|
| User-attached file > 100 MB | Cannot ingest; ask user to compress or split |
| PPTX parse error | Use `import_pptx` — never hand-parse XML |
| Research sub-agent finishes without brief file | Re-dispatch once with "WRITE the file" instruction; if still missing, use returned message as brief |
| Font fails to load in slide render | Retry once; if fails, note in review summary |
| Screenshot times out | Retry once; skip if fails |
| Manifest ↔ filesystem drift | System prepends notice at turn start; I reconcile proactively |
| Computer session lost | Boot fresh Computer; git pull to restore working copy from Project |
| Chat context loss over long build | Phase artifacts in `.guide/` are re-readable — reload on drift risk |

---

## Security boundaries

- **User's data** — attached files land in the Project store; not exposed outside
- **Web content** — read-only via crawler / web_search; not exposed
- **Sub-agent isolation** — no shared context; only shared filesystem (opt-in)
- **Computer sandbox** — ephemeral, isolated, no persistent side effects
- **Skill bundles** — loaded into `.skills/<name>/`; execute in sandboxed contexts
- **No hyperlinks on slides** — deck audience never gets clickable elements from me (see base rules)
