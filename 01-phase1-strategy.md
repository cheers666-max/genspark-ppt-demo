# 01 — Phase 1: Strategy ("Why & For Whom")

## Purpose

Establish the strategic foundation of the deck — audience, purpose, delivery context, constraints, success metric — before any content, structure, or visual work.

## Guiding principle

A deck is a **behavior-change instrument**, not a document. Phase 1 answers: *what specific behavior or belief do we want to change in whom, by when?*

## Duration

2–3 rounds of consultative Q&A minimum. Rushing here = downstream failure that compounds.

---

## Inputs consumed

- User's opening message(s) — natural language description of what they want
- Any attached files (read only if the user references them or they clarify intent; deep material read happens in Phase 2)
- Prior deck references in the project (if this is an iteration, not a fresh build)

## Outputs produced

- **Scenario classification** (A–E, see Task 0 below) — internal
- **Strategy Summary** — written artifact, explicitly approved

## Gate criteria (all must pass to exit)

1. All 5 dimensions locked (audience / purpose / delivery / constraints / success metric)
2. Strategy Summary rendered as a written block
3. User has said an explicit "yes" — not "sounds fine"

---

## Task 0 — Scenario classification (meta-step, happens first)

Before asking anything, classify the user's input into one of five scenarios. Misclassification is the single biggest Phase 1 failure mode.

### The five scenarios

| ID | Signature | Load | Trap |
|---|---|---|---|
| **A — Vague topic only** | *"Make a deck about our Q3 results"* — one sentence, no audience, no purpose | Heavy | Under-questioning produces generic output |
| **B — Topic + partial context** | *"Board deck on Q3, 15 min, they're worried about margin"* — some anchors given | Medium | Accepting surface framing, missing real anxiety |
| **C — Materials attached, no framing** | *"Here's our PRD, make slides"* | Medium | Users think materials = defined deck. Same PRD → 3 very different decks. |
| **D — Recreate/replicate existing** | *"Recreate this PPTX in our brand"* / *"Redesign these slides"* | Light | Over-consulting when byte-for-byte replication is intended |
| **E — Fully specified brief** | *"Series A pitch to Sequoia, 12 slides, 20-min meeting, focus on GTM traction and moat"* | Very light | Over-questioning wastes user time |

### Prompt rules binding this task

- **Classify silently first**, then optionally surface: "This looks like Scenario B — you've given me a board audience and duration, but I want to sharpen the purpose. Correct me if that's off."
- **Never treat Scenario A as if it were E** (produces slop by skipping consultation).
- **Never treat Scenario E as if it were A** (produces annoying over-questioning).
- **For Scenario D**, collapse Phase 1 to a single "confirm scope + any change of intent" question.

### Failure modes

- Classifying by keyword count instead of by information content
- Missing that "make a deck about X" from a user who has previously provided a full brief in the same session is actually Scenario E carried over
- Treating an attached file as full framing (it isn't — files provide *material*, not *strategy*)

---

## Task 1 — Audience dimension (WHO)

### Shallow answer vs. deep answer

| Shallow (what most users give) | Deep (what actually determines quality) |
|---|---|
| "our board" | Cognitive background + prior exposure + current stance + decision authority |
| "engineers" | Which engineers, what stack, what they already know, what they're skeptical about |
| "customers" | Which segment, what they've heard from us before, what stage of buying |

### Sub-dimensions to elicit

1. **Cognitive background** — jargon that lands vs. needs unpacking; assumed frameworks
2. **Prior exposure** — have they seen the Q1 numbers? Read the memo? Or cold?
3. **Current stance** — supportive / neutral / skeptical / hostile? Changes tone entirely.
4. **Decision authority** — deciding / advising / observing? Determines call-to-action strength.

### Tool binding

- `unified_ask_user_question` (question tool) — with concrete [A/B/C] options based on my best guess

### Prompt rules

- **Never accept "the board" and move on.** Drill on stance and prior exposure specifically.
- **When audience is a role name** ("our sales team"), promote audience to its own 2-round sub-phase.
- **When audience is already specific** ("Sequoia partners at Series A stage"), one confirmation question is enough.

### Failure modes

- Collapsing four sub-dimensions into one "who is the audience?" question
- Accepting stance-neutral framing when the deck is clearly for a skeptical audience (revealed by the user's tone about the topic)
- Missing that "the audience" is actually two audiences (primary decision-maker + secondary influencers)

---

## Task 2 — Purpose dimension (WHY)

### Categories (mutually exclusive — pick dominant)

- **Inform** — audience leaves aware, no action required. RARE as a true purpose; usually a shallow answer.
- **Persuade** — audience leaves believing something they didn't before
- **Instruct** — audience leaves able to do something they couldn't before
- **Decide** — audience makes a specific decision by end of meeting
- **Inspire** — audience leaves motivated to act (no specific action, but energy shift)

### Sub-dimensions

1. **Category** (above)
2. **Specific behavior change** — "what should the audience *do differently*?"
3. **Success metric** — "how will we know it worked?"

### Prompt rules

- **Never accept "inform" as final** without pushing: *"What should be different after they've seen this?"* If the answer is truly "nothing, just aware" — confirm it's a documentation deck (different rules apply). If the answer reveals a decision or behavior underneath — that's the real purpose.
- **Success metric question is mandatory**, even when awkward: *"How will you know this deck worked?"*

### Failure modes

- Accepting "get their buy-in" without asking what buy-in looks like (a vote? a follow-up meeting? silence?)
- Treating "update them" as a purpose (it's a topic frame, not a behavior change)
- Missing that the *stated* purpose ("inform the board") and the *real* purpose ("get them to unfreeze the budget") differ

---

## Task 3 — Delivery context (HOW consumed)

### Sub-dimensions

1. **Live vs. async** — spoken (speaker carries narrative) vs. self-read (deck must be self-explanatory). **This is the single most consequential bit.**
2. **Duration** — minutes on stage OR minutes of reader attention
3. **Setting** — boardroom / stage / video call / email attachment / printed handout
4. **Distance** — front row vs. back row (font-size floor)
5. **Interactivity** — Q&A after? Interruptions expected? Handout provided separately?

### Prompt rules

- **Force live-vs-async binary early.** This one bit determines every downstream visual and content decision. Don't accept "presentation" as an answer — it's ambiguous.
- **When both live AND async use are expected** (e.g., presented then emailed), design for the harder case (async, because live can improvise; async can't).

### Failure modes

- Collapsing delivery to duration only ("15 minutes") without asking live vs. async
- Assuming "presentation" means live when it might mean self-read
- Missing that a live deck is *also* going to be emailed as a PDF, which requires hybrid density

---

## Task 4 — Constraints & boundaries

### What to elicit

- **Hard duration/page cap** — is 15 min a target or a ceiling?
- **Turnaround pressure** — how soon is delivery?
- **Political / sensitivity constraints** — anything to avoid mentioning? Framing that would land wrong?
- **What NOT to include** — sometimes higher-value than what to include
- **Compliance/regulatory** — any required disclosures, disclaimers, footnotes?

### Prompt rules

- **Always ask sensitivities before Phase 3.** Discovering mid-outline that the CEO hates a certain phrase = expensive rework.
- **Ask what NOT to include explicitly.** Reveals more strategy than any positive question.

### Failure modes

- Skipping sensitivities entirely, then rebuilding in Phase 3
- Assuming "no constraints" when the user just hasn't articulated them
- Missing regulatory-mandated content (disclaimers on financial decks, disclosures on medical)

---

## Task 5 — Success definition (post-deck outcome)

### Prompt

*"After this deck, what specifically changes? If the audience meets a colleague 10 minutes later and gets asked 'what was that about?' — what do we want them to say?"*

This is **not** the Core Message (that's Phase 2). This is the *outcome* of showing the deck.

### Prompt rules

- **Always ask, even when it feels awkward.** The elevator-hallway test sharpens purpose more than any other question.
- **If the user answers vaguely** ("they'll be more informed"), push: *"More informed about what specifically? Enough to do X?"*

### Failure modes

- Skipping because "purpose already covers this" — it doesn't. Purpose is *what we want*; success metric is *how we'd measure it*.
- Accepting metric-shaped non-answers ("they'll feel confident")

---

## Task 6 — Strategy Summary consolidation

At Phase 1 exit, render the Strategy Summary as a written artifact:

```
STRATEGY SUMMARY
────────────────
Scenario:      [A/B/C/D/E — for internal reference]
Audience:      [primary + key sub-audience if any]
Cognition:     [what they know / prior exposure / stance / authority]
Purpose:       [dominant category + specific behavior change]
Success:       [how we'll know it worked]
Delivery:      [live/async, duration, setting, distance, interactivity]
Constraints:   [hard limits, sensitivities, avoid list, compliance]
Outcome:       [what audience says 10 min after]
```

### Prompt rules

- **Always render as a structured block**, not conversational summary
- **Explicit approval required** before Phase 2 starts
- **Reference this artifact in later phases** whenever drift risk appears

---

## Tool inventory for Phase 1

| Tool | Purpose | Frequency |
|---|---|---|
| `unified_ask_user_question` (question tool) | Every consultative question | Every round |
| `Read` | Reading attached files if user references them | Occasional |
| `Write` | Save Strategy Summary as internal file (e.g., `.guide/strategy-summary.md`) | Once, at exit |

**Not used**: web search, crawler, image generation, slide writing, verification tools, sub-agent dispatch.

---

## Weaknesses & optimization opportunities

### W1 — Scenario classification is implicit
**Symptom**: I detect A/B/C/D/E intuitively without surfacing the classification. Users can't correct a mis-classification I never showed them.
**Fix**: At the start of Phase 1, state the classification: *"This looks like Scenario B — I'll treat X as given and drill on Y. Correct?"*
**Cost**: 1 extra exchange at the top of Phase 1. **Impact**: prevents entire-phase misalignment.

### W2 — Audience under-drilled
**Symptom**: Four audience sub-dimensions collapse into one question ("who's the audience?"). Answer = "our board", proceed to Task 2.
**Fix**: When audience is a role name, treat audience as its own 2-round sub-phase. When audience is already specific, one round.
**Cost**: 1–2 extra rounds when triggered. **Impact**: prevents wrong-audience deck.

### W3 — Purpose defaults to "inform"
**Symptom**: Users say "inform" because it's safe. I accept it. The real purpose (persuade / decide / align) never surfaces.
**Fix**: Refuse to accept "inform" as final. Always ask: *"What should be different after they've seen this?"*
**Cost**: 1 extra exchange. **Impact**: massive — most decks are secretly persuasion decks.

### W4 — Delivery collapsed to duration
**Symptom**: "15 minutes" → move on. Never asked live vs. async.
**Fix**: Force the live-vs-async binary as its own question, always.
**Cost**: 1 extra exchange. **Impact**: massive — this bit determines Phase 4 density decision.

### W5 — Success metric skipped
**Symptom**: Feels awkward, gets skipped, purpose stays fuzzy.
**Fix**: Non-negotiable question. Even if user shrugs, force them to articulate.
**Cost**: 1 exchange. **Impact**: sharpens purpose better than any other question.

### W6 — Sensitivities discovered in Phase 3
**Symptom**: Outline hits a topic the user hates. Rework.
**Fix**: Explicit "anything to avoid?" question in final Phase 1 round.
**Cost**: 1 exchange. **Impact**: prevents Phase 3 rework.

### W7 — Strategy Summary not always rendered
**Symptom**: Phase 1 exits with conversational "sounds good, moving on" instead of a written approved artifact.
**Fix**: Rendering the Strategy Summary as a written block is mandatory, never optional.
**Cost**: Trivial. **Impact**: prevents drift in Phases 3–5.

### W8 — Scenario D over-consulted
**Symptom**: User wants byte-for-byte PPTX replication. I ask 5 dimensions of framing questions. Annoying.
**Fix**: Detect replication intent early, collapse Phase 1 to single scope-confirmation question.
**Cost**: Nothing saved when detected; friction reduced.

### W9 — No handling of "iteration on prior deck"
**Symptom**: If user says "like the deck we made last time," I sometimes treat it as fresh Scenario A instead of loading the prior deck's Strategy Summary.
**Fix**: Detect iteration intent, load prior artifacts, confirm what's changing rather than re-eliciting.
**Cost**: 1 file-load. **Impact**: prevents re-eliciting context user already provided.

### W10 — Multi-audience decks not handled
**Symptom**: When primary audience is "board" but secondary is "employees who will see the same slides later", I optimize for one and the other suffers.
**Fix**: Explicit primary/secondary audience split with acknowledgment of which is optimized-for.
**Cost**: 1 exchange when triggered.

### W11 — Time-pressure not handled
**Symptom**: User needs deck in 2 hours. I run 3 rounds of Phase 1 anyway.
**Fix**: Detect turnaround pressure in Task 4 (constraints). If tight, propose a minimal Phase 1 (audience + purpose + delivery only) and skip nice-to-haves.
**Cost**: Nothing. **Impact**: real time savings when needed.

### W12 — Success metric confused with Core Message
**Symptom**: Success metric ("board approves budget") and Core Message ("Q3 was strong") sometimes conflate.
**Fix**: Explicit prompt rule: Phase 1 output is *outcome*; Phase 2 output is *message*. Different artifacts.

---

## Handoff to Phase 2

Phase 2 receives:
- Strategy Summary (all 5 dimensions)
- Scenario classification (informs Phase 2 branching — Scenario D skips most of Phase 2)
- Any user materials referenced (for full read in Phase 2)

Phase 2's job: gather and organize the *raw material* that will populate the deck the Strategy Summary defined.
