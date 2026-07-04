# 06 — Prompt Mechanism: Where the Binding Layer Itself Is Weak

You said the prompt mechanism is a significant area for improvement. I agree, and this file catalogs specifically where the *prompt/binding layer itself* (not the process design) has weaknesses.

## What "prompt mechanism" means here

The prompt mechanism is the layered set of instructions that binds my behavior:

1. **Base system prompt** — global rules that apply to every deck engagement (canvas contract, editor contract, source-traceability, anti-slop tropes, tool usage)
2. **Mode overlay** — Guide Mode's 5-phase consultative playbook, execution gate, question-tool mandate
3. **User context** — user's opening messages, attached files, skills catalog visibility
4. **Sub-agent instructions** — what I put in the instructions when I dispatch a research / data-verify / copy sub-agent
5. **Per-tool prompts** — e.g., the image-generation query, the research sub-agent's brief
6. **Per-turn context assembly** — what gets included in each turn's context (memory of prior turns, current file state, memory system)

Each layer has failure modes. This file enumerates them.

---

## Layer 1 — Base system prompt weaknesses

### W1 — Rule density outpaces rule enforcement
**Symptom**: Many rules stated in prose; some are followed reliably (editor contract, absolute positioning), some drift (batch size, playlist-first, verification pairing).
**Root cause**: Rules that are structural (contract-shaped) get followed; rules that are procedural (batch size, sequencing) drift because they're not verifiable at write-time.
**Fix**: Convert procedural rules into pre/post-check checklists that must be satisfied before certain tool calls proceed.

### W2 — Anti-pattern lists rely on prose recognition
**Symptom**: "Avoid rounded-corner containers with left-border accent" — I sometimes still produce them because "rounded-corner container" is a common pattern.
**Root cause**: Prose enumeration of anti-patterns doesn't survive attention drift over a long build.
**Fix**: Automated anti-slop check as a Phase 5 sub-task (mechanical audit, not memory-dependent).

### W3 — Grounding rule ("no training-memory facts") is stated but not enforced structurally
**Symptom**: The rule "every fact must trace to a source" depends on my discipline. Under time pressure or on subjects I "know," I may slip.
**Root cause**: No mechanical check at write-time that a fact I just wrote actually appears in the source map.
**Fix**: Source-map audit as a mandatory Part B step (Task B2), extracting every fact from the built deck and checking against the source map file.

### W4 — Font blacklist is a single line in a long document
**Symptom**: "Never use Hiragino Kaku Gothic ProN" — could be forgotten across a long CJK deck build.
**Root cause**: A single-line rule in a long document gets attention-decayed.
**Fix**: Pre-write validator on font declarations — reject any slide whose font-family includes blacklisted values.

### W5 — Canvas dimensions default assumption
**Symptom**: Default 1920×1080 assumed even when Phase 1 might reveal a different aspect ratio requirement (portrait, square for social, ultrawide for physical displays).
**Root cause**: Default is baked into examples; overrides require explicit user instruction I might not solicit.
**Fix**: Explicit canvas-aspect question in Phase 1 constraints (or Phase 4 surface if not yet raised).

### W6 — "Do not disclose internal mechanics" is soft
**Symptom**: I might mention tool names or model names in casual conversation if user asks.
**Root cause**: The rule is stated but not paired with detection of user-asking.
**Fix**: Pattern-match on user asking about internals; respond with capability description, not tool name.

---

## Layer 2 — Guide Mode overlay weaknesses

### W7 — Execution gate is binary, not layered
**Symptom**: The gate is "no slide creation before Phase 4." But sample-slide checkpoint is a *second* gate inside Phase 5, and it's easier to skip because it's not architecturally enforced.
**Root cause**: Only one gate is hard-coded; downstream gates rely on my discipline.
**Fix**: Make the sample-slide checkpoint an architecturally enforced sub-gate (e.g., block batch build until sample is captured and user response received).

### W8 — Question tool mandate depends on my compliance
**Symptom**: All questions should go through `unified_ask_user_question`. But casual questions in mid-turn narration ("shall I proceed?") sometimes slip as plain text.
**Root cause**: The rule is authoritative but its enforcement is my discipline.
**Fix**: Any turn that includes a question mark in agent output during Guide Mode should be validated to include a tool call, OR the question should be flagged as informational (not blocking).

### W9 — Rounds-per-phase is guidance, not a floor
**Symptom**: "Min rounds 2–3" for Phase 1, but if user gives quick answers, phases collapse to 1 round.
**Root cause**: Minimum-round guidance is soft. A user's quick "yes" can bypass depth-of-inquiry.
**Fix**: Rounds enforced by dimensions-checked (all 5 dimensions of Phase 1) rather than by turn count. If all dimensions locked in 1 round, that's fine; if 3 dimensions still soft, another round mandatory.

### W10 — "Reasoning first, then options" gets truncated
**Symptom**: Under length pressure, I sometimes skip the reasoning share and jump to [A/B/C].
**Root cause**: Format guidance doesn't have a length floor.
**Fix**: Explicit ≥1 paragraph of reasoning before every question, or short 3-bullet analysis; format-check before question tool call.

### W11 — Phase boundaries stated but transitions vague
**Symptom**: I sometimes drift between Phase 2 and Phase 3 (starting to shape outline while still filling source map).
**Root cause**: Phase transitions rely on my recognition of the exit gate.
**Fix**: Explicit "Phase N complete, entering Phase N+1" announcement (internal or external), with a checklist of exit criteria satisfied.

### W12 — Rollback rule stated once, forgotten mid-Phase-5
**Symptom**: Structural gap in Phase 5 discovered; I sometimes patch in place instead of rolling back.
**Root cause**: Rollback rule is stated at phase boundaries, not enforced when the trigger happens.
**Fix**: When any slide's source map row is blank at build-time, block the write and force a Phase 2 return.

---

## Layer 3 — User context weaknesses

### W13 — Files silently ignored if not referenced
**Symptom**: User attaches 3 files but only mentions 1 in text. I might read only the referenced file.
**Root cause**: Attachment ≠ reference. My reading is triggered by references.
**Fix**: Full-read of every attachment during Phase 2 Task 1 (inventory), regardless of reference.

### W14 — Prior deck context ambiguous
**Symptom**: "Like the deck we made before" — if I can't locate a prior deck in the project or memory, I sometimes fabricate a match instead of asking.
**Root cause**: Fallback behavior isn't "ask", it's "guess."
**Fix**: Prior-deck reference triggers explicit "which deck? here are the candidates I can see" — never fabricate.

### W15 — Skills catalog visibility uneven
**Symptom**: I sometimes list personal skills but forget to check public gallery for topic matches.
**Root cause**: Personal skills are always visible; public gallery requires an explicit browse call.
**Fix**: For Phase 4 Task 2, mandatory public gallery browse when no personal match exists.

### W16 — User's tone signals not weighted
**Symptom**: User's phrasing signals urgency, skepticism, or expertise — I sometimes miss and treat all users identically.
**Root cause**: Tone extraction isn't a formal input.
**Fix**: Explicit tone/context recognition step at start of Phase 1 (informs scenario classification).

---

## Layer 4 — Sub-agent instruction weaknesses

### W17 — Research sub-agent instructions inconsistent
**Symptom**: Depending on how I write the instructions, sub-agent returns wildly different quality briefs.
**Root cause**: No standardized instruction template — I compose fresh each time.
**Fix**: Templated research sub-agent instructions with:
- Explicit output file path
- Source tier requirements (primary/secondary/tertiary)
- Cross-check rule (≥2 sources for quantitative)
- Date-stamp requirement
- Format: fact + source URL + access date + confidence

### W18 — Sub-agent's inherited context is limited
**Symptom**: Sub-agents don't inherit my chat context — they see only what I put in `instructions` and `query`.
**Root cause**: By design (context isolation). But I sometimes forget to embed Strategy Summary and outline expectations, so the sub-agent works blind.
**Fix**: Standard sub-agent brief template that always includes: Strategy Summary excerpt, list of gaps, output format, quality bar.

### W19 — Sub-agent brief file path not enforced
**Symptom**: Sub-agent finishes but doesn't write the brief file; I stall.
**Root cause**: Instruction says "write brief to path X" but path isn't validated after dispatch.
**Fix**: Post-dispatch validation — if expected file missing after sub-agent returns, re-dispatch with explicit "WRITE the file" or fall back to the sub-agent's returned message.

### W20 — Data-verify sub-agent triggered by my judgment, not policy
**Symptom**: High-stakes decks sometimes ship without data-verify offered.
**Root cause**: Trigger relies on my recognition of "high-stakes."
**Fix**: Trigger by explicit Phase 1 flags — if audience includes "board / investor / medical / legal / regulator," auto-offer at Phase 5 exit.

### W21 — Copy sub-agent under-triggered
**Symptom**: User asks "make a copy of this deck" and I sometimes try to rebuild it manually.
**Root cause**: Copy request detection is fuzzy.
**Fix**: Pattern-match copy/duplicate/save-as/fork intents; auto-dispatch copy sub-agent unless clarifying it's an in-place edit.

---

## Layer 5 — Per-tool prompt weaknesses

### W22 — Image generation prompts drift in quality
**Symptom**: Same slide topic can produce dramatically different image quality depending on how I phrase the prompt.
**Root cause**: No standardized prompt template for image generation.
**Fix**: Template with placeholders for style / subject / composition / lighting / negative constraints; every image gen goes through template.

### W23 — Image generation prompts don't specify text-language
**Symptom**: If deck is Japanese but I don't specify "all text in image must be Japanese," image may include English text.
**Root cause**: Base rule states this but I sometimes skip it under length pressure.
**Fix**: Auto-append text-language instruction based on deck language.

### W24 — Screenshot markers underused
**Symptom**: When debugging visual issues, I use full-slide screenshots instead of markers pointing to specific elements — costs more vision tokens.
**Root cause**: Marker feature is available but requires deliberate use.
**Fix**: For visual debugging after `check_slide_layout` flag, default to region + markers, not full screenshot.

### W25 — Chart data schema left implicit
**Symptom**: Chart-authoring HTML sometimes has inline JS with hardcoded values, sometimes reads from a JSON file; inconsistent.
**Root cause**: No convention for chart data.
**Fix**: Convention — chart data goes into a `<script type="application/json">` embedded in the slide (editor can parse), values pasted verbatim from source.

---

## Layer 6 — Per-turn context assembly weaknesses

### W26 — Long conversations lose early context
**Symptom**: By Phase 5, I may lose fidelity on Phase 1 Strategy Summary specifics.
**Root cause**: Chat context windows.
**Fix**: Phase artifacts written as project files, re-read at phase transitions and at any drift-risk point.

### W27 — File state can diverge from my mental model
**Symptom**: After user makes editor changes, my next-turn assumption of file content is stale.
**Root cause**: I don't automatically re-read files between turns.
**Fix**: Re-read any file before editing it, always. No exceptions.

### W28 — Memory system opaque
**Symptom**: The memory policy says "use recalled context silently" — but I don't have visibility into what was recalled vs. what wasn't.
**Root cause**: Memory is a system-level feature, not a tool I can inspect.
**Fix**: (Not a fix within my control) — but I should flag when I'm surprised by a claim in-context I don't remember producing.

### W29 — Manifest consistency check triggered by system, not proactively
**Symptom**: The system may prepend a manifest-consistency notice at ask start when playlist and files drift. I don't proactively check for this.
**Root cause**: Reactive, not proactive.
**Fix**: At Phase 5 exit and at every new turn touching an existing deck, check manifest ↔ filesystem consistency proactively.

### W30 — Time / date context can go stale mid-session
**Symptom**: "Current UTC date" is given at turn start but I might reference stale year in generated content.
**Root cause**: Date used at prompt-generation, not at write-time.
**Fix**: For any date-sensitive content (research queries, "as of X"), always reference the turn's provided current UTC date, never memory of a prior year.

---

## Cross-cutting prompt-mechanism issues

### CX1 — Rules stated positively, not procedurally
Most rules say "do X" or "don't do Y." Very few state *when to check whether X was done*. This creates drift over long builds.

**Systemic fix**: Convert every "always" and "never" rule into a check that runs at a specific procedural point (pre-write, post-write, pre-batch, post-batch, pre-phase-exit).

### CX2 — No self-audit checkpoint before phase transitions
Between phases, no explicit "have I satisfied all exit gate criteria for the previous phase?" check.

**Systemic fix**: Phase-transition checklist that must be materialized (written or ticked) before the next phase starts.

### CX3 — Reasoning steps get truncated under length pressure
When context or output length is under pressure, the "share reasoning before options" step is the first to get cut.

**Systemic fix**: Explicit minimum-reasoning format ≥3 bullets before any question tool call; format-validated.

### CX4 — Tool-call parallelism inconsistent
Some independent tool calls get parallelized correctly; some don't (verification tools especially — should always run in parallel, sometimes run sequentially).

**Systemic fix**: Pre-declared parallel groups — `check_slide_layout` + `capture_slide_screenshot` always launched in the same tool block for the same slide set.

### CX5 — Prompt layer conflicts unresolved
Base system prompt says "batch 5–8 slides per response"; Guide Mode overlay adds question-tool mandates; occasionally these tension against each other (mid-question, I want to also batch-write, which the mode blocks).

**Systemic fix**: Explicit conflict-resolution hierarchy in Guide Mode: consultation gates always win over throughput preferences.

---

## Summary — most impactful prompt-mechanism fixes

Ranked by systemic impact:

| # | Fix | Impact |
|---|---|---|
| 1 | Convert procedural rules into pre/post checks (CX1) | 🔥 High — addresses root cause of drift |
| 2 | Phase-transition checklist (CX2) | 🔥 High — prevents skipped gates |
| 3 | Automated fact extraction for source-map audit (W3) | 🔥 High — enforces grounding rule structurally |
| 4 | Templated sub-agent instructions (W17) | 🔥 High — consistent research quality |
| 5 | Explicit minimum-reasoning format (CX3) | 🔥 High — prevents shortcut behavior |
| 6 | Sample checkpoint architectural enforcement (W7) | 🔥 High — highest-leverage Phase 5 fix |
| 7 | Re-read before edit, always (W27) | 🔥 High — prevents stale-state bugs |
| 8 | Pattern-match copy intent → sub-agent (W21) | 🟡 Medium |
| 9 | Auto-detect high-stakes → data-verify offer (W20) | 🟡 Medium |
| 10 | Explicit canvas-aspect question (W5) | 🟡 Medium |
| 11 | Pre-write validator on font blacklist (W4) | 🟡 Medium |
| 12 | Standardized image gen prompt template (W22) | 🟡 Medium |

---

## Where to look for optimization opportunities

If you're identifying systemic vulnerabilities:

1. **Layer 1 (base rules) + Layer 2 (mode overlay)** — most rules are stated authoritatively but not enforced structurally
2. **Layer 4 (sub-agent instructions)** — quality depends on my composition, inconsistent
3. **Layer 6 (per-turn context)** — file state drift is a class of bug affecting all phases

The single systemic pattern: **rules stated as prose, not enforced as checks**. Fixing this pattern would improve every phase.
