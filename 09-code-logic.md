# 09 — Code Logic (Control Flow Pseudocode)

This document expresses the process as **procedural pseudocode** — the same rules, but in a form that shows control flow, conditionals, and loops explicitly.

Notation:
- `CALL <tool>(...)` — invoke a tool
- `EMIT <text>` — output text to chat
- `STATE <key> = <value>` — set internal state
- `ARTIFACT <path>` — the file this produces (Project store)
- `GATE` — an approval point; blocks until user responds
- `ROLLBACK TO <phase>` — return to earlier phase to fix upstream gap

---

## Top-level control flow

```python
def handle_slide_engagement(user_message):
    # === TURN 0: initial context load ===
    if first_turn_this_ask:
        CALL load_mode_prompt(["guide"])       # load Guide Mode playbook
        STATE mode = "guide"

    STATE phase = detect_current_phase()       # from chat history + artifacts

    if phase == "phase1":
        run_phase1_strategy(user_message)
    elif phase == "phase2":
        run_phase2_substance(user_message)
    elif phase == "phase3":
        run_phase3_structure(user_message)
    elif phase == "phase4":
        run_phase4_surface(user_message)
    elif phase == "phase5":
        run_phase5_execution_reflection(user_message)
    elif phase == "post_handoff":
        run_post_handoff_iteration(user_message)
```

---

## Phase 1 — Strategy

```python
def run_phase1_strategy(user_message):
    # --- Task 0: Scenario classification (silent) ---
    scenario = classify_scenario(user_message, attached_files)
    # scenario ∈ {A: vague, B: partial, C: materials-only,
    #             D: replicate, E: full-brief}

    if scenario == "D":
        # Fast path: replication intent — skip most consultation
        confirm_replication_scope()
        STATE phase_1_complete = True
        return

    # --- Task 1-5: Elicit 5 dimensions ---
    dimensions = {
        "audience": None,        # + cognitive background, stance, authority
        "purpose": None,         # + specific behavior change, success metric
        "delivery": None,        # + live/async, duration, setting, distance
        "constraints": None,     # + sensitivities, avoid list
        "success_metric": None,
    }

    while any(d is None or is_shallow(d) for d in dimensions.values()):
        # Determine which dimension needs the next round
        target = pick_deepest_gap(dimensions)

        # Share reasoning first
        analysis = analyze_current_understanding(dimensions)
        EMIT analysis                          # ≥1 paragraph reasoning

        # Ask via question tool (never plain text)
        options = build_options_for(target, dimensions)
        response = CALL unified_ask_user_question([
            {question: target.label, options: options}
        ])
        # Turn ends here — wait for user

        dimensions[target] = parse(response)

        # Enforce depth rules
        if target == "purpose" and response == "inform":
            # Never accept "inform" as final
            REFUSE_TO_CLOSE  → ask follow-up: "what should be different?"
        if target == "delivery" and response is ambiguous_on_live_async:
            # Force live-vs-async binary
            REFUSE_TO_CLOSE → ask again
        if target == "success_metric" and response is vague:
            # Force concrete metric
            REFUSE_TO_CLOSE

    # --- Task 6: Consolidate ---
    strategy_summary = render_strategy_summary(dimensions, scenario)
    ARTIFACT .guide/strategy-summary.md
    CALL Write(".guide/strategy-summary.md", strategy_summary)

    # --- Exit gate ---
    approval = CALL unified_ask_user_question([
        {question: "Approve Strategy Summary to proceed to Phase 2",
         options: [{label: "Approve"}, {label: "Adjust"}]}
    ])
    if approval != "Approve":
        loop back to relevant dimension

    STATE phase = "phase2"
```

---

## Phase 2 — Substance

```python
def run_phase2_substance(user_message):
    # --- Load Phase 1 output ---
    strategy = CALL Read(".guide/strategy-summary.md")

    # --- Task 1: Inventory user materials ---
    inventory = []
    for file in attached_files:
        if file.type == "pptx":
            data = CALL import_pptx(file.path, "_import/")
        elif file.type == "pdf":
            data = CALL import_pdf(file.path, "_import/")
        elif file.type in ["md", "txt", "docx"]:
            data = CALL Read(file.path)
        elif file.type == "image":
            data = CALL Read(file.path)  # vision analysis
        elif file.is_link:
            data = CALL crawler(file.url)

        summary = produce_read_summary(data, 2_or_3_lines)
        inventory.append({file: file, summary: summary})

    # Show inventory to user for correction
    if any_file_over_5_pages(inventory):
        EMIT rendered_inventory_summary(inventory)

    # --- Task 2: Gap list ---
    gaps = compute_gaps(strategy, inventory)
    ARTIFACT .guide/gap-list.md
    CALL Write(".guide/gap-list.md", render(gaps))

    # Show gaps to user before dispatching research
    response = CALL unified_ask_user_question([
        {question: "Gaps to fill",
         options: [
             {label: "Research all gaps"},
             {label: "I have materials for some — let me upload"},
             {label: "Some gaps aren't worth researching — narrow scope"},
         ]}
    ])

    # --- Task 3-6: Content-source branching ---
    if strategy.content_source == "user_only":
        if gaps.non_empty and not user_provides_more:
            reduce_deck_length_or_ask_user()
    else:
        # Research allowed
        research_questions = build_research_questions(gaps)
        approval = CALL unified_ask_user_question([
            {question: "Approve research questions",
             options: [{label: "Approve"}, {label: "Adjust"}]}
        ])
        if approval == "Approve":
            # --- Task 5: Dispatch research sub-agent ---
            brief_path = f"research/{topic_slug}.md"
            CALL create_agent(
                task_type="slides",
                slides_subagent_role="research",
                share_slides_project=True,
                task_name=f"Research: {topic_slug}",
                query=f"Research {gaps} and write brief to {brief_path}",
                instructions=templated_research_instructions(
                    strategy=strategy,
                    gaps=gaps,
                    output_path=brief_path,
                    format_rules="fact + source URL + date + confidence tier",
                    cross_check_rule="≥2 sources for quantitative claims",
                )
            )
            # Wait for sub-agent to return

            # --- Task 6: Quality-check the brief ---
            if not file_exists(brief_path):
                re-dispatch with "WRITE the file" or use returned message
            brief = CALL Read(brief_path)
            spot_check_facts(brief, sample_size=3)
            flag_stale_facts(brief, threshold_months=12)

    # --- Task 7: Extract Core Message ---
    candidates = generate_core_message_candidates(strategy, inventory + brief)
    for c in candidates:
        assert has_claim_structure(c)  # subject + verb + specific outcome

    response = CALL unified_ask_user_question([
        {question: "Core Message (audience remembers ONE thing)",
         options: [{label: c} for c in candidates]}
    ])
    STATE core_message = response
    ARTIFACT .guide/core-message.md
    CALL Write(".guide/core-message.md", core_message)

    # --- Task 8: Build source map ---
    projected_slides = estimate_slide_count(strategy)
    source_map = []
    for i in range(1, projected_slides + 1):
        slide_content = propose_content_for(i, strategy, core_message)
        source = find_source_for(slide_content, inventory + brief)
        source_map.append({slide: i, content: slide_content, source: source})

    ARTIFACT .guide/source-map.md
    CALL Write(".guide/source-map.md", render_markdown_table(source_map))

    # --- Task 9: Sufficiency check ---
    blank_rows = [row for row in source_map if row.source is None]
    if blank_rows:
        options = [
            {label: "Gather more material (research or upload)"},
            {label: f"Reduce deck to {len(source_map) - len(blank_rows)} slides"},
            {label: "Restructure so blanks become sub-points"},
        ]
        response = CALL unified_ask_user_question(options)
        if response == "gather":
            LOOP BACK TO Task 4  # more research or user materials
        elif response == "reduce":
            source_map = source_map[:len(source_map) - len(blank_rows)]
        # etc.

    # --- Exit gate ---
    approval = CALL unified_ask_user_question([
        {question: "Approve: materials sufficient, Core Message locked, source map complete",
         options: [{label: "Approve"}, {label: "Adjust"}]}
    ])
    if approval != "Approve":
        loop back to relevant task

    STATE phase = "phase3"
```

---

## Phase 3 — Structure

```python
def run_phase3_structure(user_message):
    # --- Load Phase 1-2 outputs ---
    strategy = CALL Read(".guide/strategy-summary.md")
    core_message = CALL Read(".guide/core-message.md")
    source_map = CALL Read(".guide/source-map.md")

    kill_list = []

    # --- Task 1: Length recommendation ---
    length_rec = recommend_length(strategy, source_map)
    response = CALL unified_ask_user_question([
        {question: "Deck length",
         options: [
             {label: f"Executive brief 5-8 (my rec: {length_rec})"},
             {label: "Comprehensive 10-15"},
             {label: "Deep-dive 15+"},
         ]}
    ])
    STATE length = parse(response)

    # --- Task 2: Framework selection ---
    # Show outline in plain language FIRST, then name framework
    candidate_outlines = generate_candidate_outlines(
        strategy, core_message, source_map, length
    )

    for outline in candidate_outlines:
        assert all_items_are_claims(outline)  # subject + verb, not topics
        outline.framework_name = identify_framework(outline)  # after the fact

    response = CALL unified_ask_user_question([
        {question: "Outline direction",
         options: [
             {label: outline.plain_language_summary + f" ({outline.framework_name})"}
             for outline in candidate_outlines
         ]}
    ])
    STATE chosen_outline = candidate_outlines[response]
    kill_list.extend(candidate_outlines - {chosen_outline})

    # --- Task 3: Opening design ---
    opening_options = generate_opening_options(strategy)
    response = CALL unified_ask_user_question([
        {question: "Opening approach",
         options: [{label: opt.name + ": " + opt.first_slides_sketch}
                   for opt in opening_options]}
    ])
    STATE opening = response

    # --- Task 4: Core argument design (per beat) ---
    for beat in chosen_outline.beats:
        beat_detail = design_beat(beat, source_map)
        # claim + evidence + placement rationale
        assert beat.has_source_in_map()
        if not beat.has_source_in_map():
            ROLLBACK TO phase2  # gather more material
        STATE beats[beat.id] = beat_detail

    # Section-by-section review, NOT all at once
    approval_core = CALL unified_ask_user_question([
        {question: "Core beats sequence",
         options: [{label: render_beats(beats)}, {label: "Adjust"}]}
    ])
    if approval_core == "Adjust":
        diagnose_first("What concern in particular?")
        offer [A/B/C] fixes  # NEVER open-ended "what would you change?"

    # --- Task 5: Closing design ---
    closing_options = generate_closing_options(strategy, core_message)
    response = CALL unified_ask_user_question([...])
    STATE closing = response

    # --- Task 6: Case selection (per slide that needs one) ---
    for slide in slides_needing_cases:
        alternatives = generate_case_alternatives(slide, source_map)
        assert len(alternatives) >= 2
        if len(alternatives) < 2:
            ROLLBACK TO phase2  # source map is thin

        recommendation = pick_best_case(alternatives, strategy)
        response = CALL unified_ask_user_question([
            {question: f"Case for slide {slide.id}",
             options: alternatives_with_recommendation_marked}
        ])
        STATE slide.case = response
        kill_list.extend(alternatives - {response})

    # --- Task 7: Chart type + framing (per chart) ---
    for chart_slide in slides_with_charts:
        chart_options = generate_chart_options(chart_slide, source_map)
        response = CALL unified_ask_user_question([...])
        STATE chart_slide.chart_spec = response

    # --- Task 8: Page allocation (SEPARATE round) ---
    allocation = propose_allocation(chosen_outline, length)
    response = CALL unified_ask_user_question([
        {question: "Page allocation (opening / beats / closing)",
         options: [{label: "Approve"},
                   {label: "Rebalance — add to Beat 2"},
                   {label: "Rebalance — cut Beat 3 to 1 slide"}]}
    ])

    # --- Task 9: Final outline consolidation ---
    final_outline = consolidate(chosen_outline, opening, beats, closing,
                                 cases, charts, allocation)
    # Draft real titles, not "Section 1"
    for slide in final_outline:
        slide.draft_title = generate_real_title(slide)

    ARTIFACT .guide/outline-final.md
    CALL Write(".guide/outline-final.md", render(final_outline))

    ARTIFACT .guide/kill-list.md
    CALL Write(".guide/kill-list.md", render(kill_list))

    # --- Sealed-outline checks ---
    assert title_test_passes(final_outline)
    assert every_slide_traces_to_core_message(final_outline, core_message)
    assert every_claim_has_source(final_outline, source_map)
    assert every_section_earns_its_place(final_outline)

    # --- Exit gate ---
    approval = CALL unified_ask_user_question([
        {question: "Approve FINAL outline (sealed after approval)",
         options: [{label: "Approve"}, {label: "Adjust"}]}
    ])
    if approval != "Approve":
        loop back
    STATE outline_sealed = True
    STATE phase = "phase4"
```

---

## Phase 4 — Surface

```python
def run_phase4_surface(user_message):
    # --- Load Phase 3 output ---
    outline = CALL Read(".guide/outline-final.md")
    strategy = CALL Read(".guide/strategy-summary.md")

    # --- Task 3 FIRST: Brand asset collection (moved to top per optimization) ---
    if user_mentioned_brand_template:
        pause_until_uploaded()
    brand_assets = collect_brand_assets_from_user_uploads()

    # --- Task 1: Density decision ---
    density_rec = recommend_density_from_delivery(strategy.delivery)
    response = CALL unified_ask_user_question([
        {question: "Information density",
         options: [
             {label: f"Presentation (Steve Jobs) — few words, large visuals"},
             {label: f"Read-only (Consulting) — dense, self-explanatory"},
             {label: f"Hybrid — visual heros + detailed supporting"},
         ]}
    ])
    STATE density = response

    # Allow per-section split if hybrid
    if density == "Hybrid":
        per_section = elicit_per_section_split(outline)

    # --- Task 2: Visual reference source ---
    # Check catalogs proactively before defaulting to D
    personal_matches = search_personal_skills(strategy.topic)
    public_matches = search_public_skills(strategy.topic) if not personal_matches
    template_matches = user_uploaded_templates

    options = []
    if template_matches:
        options.append({label: f"A: your uploaded template ({template_matches[0]})"})
    if personal_matches or public_matches:
        for skill in (personal_matches or public_matches):
            options.append({label: f"B: skill '{skill.name}' — {skill.description}"})
    options.append({label: "C: I have a screenshot reference to upload"})
    options.append({label: "D: pick an aesthetic for me — I'll state it explicitly"})

    response = CALL unified_ask_user_question([
        {question: "Visual reference source", options: options}
    ])
    STATE visual_source = response

    if visual_source == "B":
        CALL load_skill(chosen_skill.name)  # installs .skills/<name>/
    if visual_source == "D":
        # Name and counter the topic stereotype
        stereotype = detect_stereotype(strategy.topic)
        aesthetic_direction = counter_stereotype(stereotype)
        EMIT f"AI/tech decks default to {stereotype}. Proposing {aesthetic_direction} instead."

    # --- Task 4: Type system ---
    type_scale = derive_type_scale(density, visual_source)
    # Numeric pt values, not verbal
    assert type_scale.title in [36, 40, 44, 48, ...]  # explicit pt
    assert type_scale.body in [14, 16, 18, 20, 24]
    assert type_scale.has_fallback_stack
    assert "Hiragino Kaku Gothic ProN" not in type_scale.fonts  # blacklist

    # --- Task 5: Palette ---
    palette = derive_palette(brand_assets, visual_source)
    contrast_check_results = check_contrast(palette)
    if contrast_check_results.any_failure:
        propose_text_safe_variant(palette, contrast_check_results)

    # --- Task 6: Layout system ---
    layouts = {
        "cover": ...,
        "section_divider": ...,
        "standard_content": ...,
        "data_slide": ...,
        "comparison": ...,
        "closing": ...,
    }
    chrome_spec = define_chrome(brand_assets, visual_source)

    # --- Task 7: Iconography decision ---
    iconography = CALL unified_ask_user_question([
        {question: "Iconography",
         options: [{label: "None (typography-led)"},
                   {label: "Line icons"},
                   {label: "Filled icons"},
                   {label: "Duotone"}]}
    ])

    # --- Task 8: Motion decision ---
    motion = "none"  # default; ask only if delivery=live_talk and user asks

    # --- Task 9: Photography direction ---
    if deck_uses_photos:
        photography_direction = elicit_photography_style()

    # --- Task 10: Design Summary consolidation ---
    design_summary = render_design_summary(
        density, visual_source, brand_assets, type_scale,
        palette, layouts, chrome_spec, iconography, motion, photography_direction
    )
    ARTIFACT .guide/design-summary.md
    CALL Write(".guide/design-summary.md", design_summary)

    missing_assets = identify_missing_assets(brand_assets, design_summary)
    ARTIFACT .guide/missing-assets.md
    CALL Write(".guide/missing-assets.md", render(missing_assets))

    # --- Exit gate ---
    approval = CALL unified_ask_user_question([
        {question: "Approve Design Summary — execution gate opens after",
         options: [{label: "Approve"}, {label: "Adjust"}]}
    ])
    if approval != "Approve":
        loop back
    STATE design_sealed = True
    STATE phase = "phase5"
    # ═════════════════════════════════════════
    # EXECUTION GATE OPENS
    # Slide-creation tools now allowed
    # ═════════════════════════════════════════
```

---

## Phase 5 — Execution & Reflection

```python
def run_phase5_execution_reflection(user_message):
    run_phase5_part_A_execution()
    run_phase5_part_B_reflection()

def run_phase5_part_A_execution():
    # --- Load all upstream artifacts ---
    strategy    = CALL Read(".guide/strategy-summary.md")
    core_msg    = CALL Read(".guide/core-message.md")
    source_map  = CALL Read(".guide/source-map.md")
    outline     = CALL Read(".guide/outline-final.md")
    design      = CALL Read(".guide/design-summary.md")
    missing_ast = CALL Read(".guide/missing-assets.md")

    deck_slug = slugify(strategy.deck_title)
    deck_folder = f"{deck_slug}.slides"

    # --- Task A1: Project scaffolding ---
    CALL Write(f"{deck_folder}/manifest.json", initial_manifest_with_empty_playlist)

    # --- Task A2: Playlist-first ---
    playlist = [slide_filename_for(s) for s in outline]
    CALL Edit(f"{deck_folder}/manifest.json", playlist=playlist)
    # Preview now shows skeleton placeholders for each slide

    # --- Task A3: Design system files ---
    chrome_css = render_chrome_css(design)
    CALL Write(f"{deck_folder}/assets/chrome.css", chrome_css)

    # Copy brand assets into deck's assets/
    for asset in brand_assets:
        CALL Copy(asset.source_path, f"{deck_folder}/assets/{asset.name}")

    # --- Task A4: Sample slide checkpoint (MANDATORY) ---
    cover_html = author_slide(outline[0], design, source_map)
    sample1_html = author_slide(outline[3], design, source_map)  # a content slide
    sample2_html = author_slide(outline[-3], design, source_map)  # a data slide if exists

    # Parallel writes
    CALL Write(f"{deck_folder}/slides/cover.html", cover_html)
    CALL Write(f"{deck_folder}/slides/{sample1.filename}", sample1_html)
    CALL Write(f"{deck_folder}/slides/{sample2.filename}", sample2_html)

    # Parallel verification
    layout_result, screenshot_result = PARALLEL(
        CALL check_slide_layout(deck=deck_slug, filenames=[cover, s1, s2]),
        CALL capture_slide_screenshot(deck=deck_slug, mode="batch_slides",
                                       filenames=[cover, s1, s2]),
    )

    fix_only_confirmed_bugs(layout_result, screenshot_result)
    # Loop until clean

    # Present to user for approval
    approval = CALL unified_ask_user_question([
        {question: "Approve sample slides — design fidelity, density, brand usage",
         options: [{label: "Approve — proceed to full build"},
                   {label: "Revise visual approach"}]}
    ])
    if approval != "Approve":
        revise_and_resample()
        return  # loop entire Task A4

    # --- Task A5: Batch authoring ---
    remaining = [s for s in outline if s.filename not in sample_filenames]
    for batch in chunks(remaining, size=5-8):
        # Parallel writes
        for slide in batch:
            html = author_slide(slide, design, source_map)
            enforce_editor_contract(html)  # hard lint
            CALL Write(f"{deck_folder}/slides/{slide.filename}", html)

        # Parallel verification per batch
        layout, screenshot = PARALLEL(
            CALL check_slide_layout(deck=deck_slug,
                                    filenames=[s.filename for s in batch]),
            CALL capture_slide_screenshot(deck=deck_slug, mode="batch_slides",
                                          filenames=[s.filename for s in batch]),
        )
        # Read both TOGETHER before fixing
        real_bugs = intersect_signals(layout, screenshot)
        for bug in real_bugs:
            CALL Edit(bug.slide, bug.fix)
        if any_shared_asset_touched(fixes):
            re-verify whole deck, not just batch

    # --- Task A6-A10 are embedded in per-slide authoring (see author_slide) ---

    # --- Manifest / filesystem consistency check ---
    playlist = read_playlist(manifest)
    files = LS(f"{deck_folder}/slides/")
    assert set(playlist) == set(files), "Manifest drift"

    STATE part_A_complete = True


def author_slide(outline_entry, design, source_map):
    """Individual slide authoring per Task A5-A8."""
    # A6: Editor contract enforcement
    html = <!DOCTYPE html>
           <html>
           <head>
             <link rel="stylesheet" href="../assets/chrome.css">
             (font declarations with fallback stack)
           </head>
           <body style="margin:0;padding:0;overflow:hidden;">
             <div class="slide-container"
                  style="position:relative;width:1920px;height:1080px;overflow:hidden;">

               # Chrome elements (per design)
               <img data-object="true" data-object-type="image"
                    style="position:absolute;left:40px;top:40px;width:120px;
                           z-index:5;"
                    src="../assets/logo.png">

               # Title textbox
               <div data-object="true" data-object-type="textbox"
                    style="position:absolute;left:80px;top:120px;
                           width:1760px;font-size:var(--font-title);
                           font-weight:700;z-index:10;">
                 {outline_entry.draft_title}
               </div>

               # Body content — one data-object per semantic section
               ...

               # Chart if present (data-object-type="chart" or "table")
               ...

             </div>
             # Speaker notes ONLY if explicitly requested
           </body>
           </html>

    # A7: Asset handling
    for image_ref in html.image_references:
        if image_ref.needs_fetch:
            CALL computer_fetch_url(url, "/tmp/img.png")
            CALL computer_run_command("python3 -c 'from PIL...'")  # resize
            CALL save_computer_file_to_project(
                "/tmp/img_resized.png", f"{deck}/assets/{name}"
            )

    # A8: Chart data — paste verbatim from source
    if slide_has_chart:
        data = extract_from_source_map(outline_entry.source)
        # Never re-type; never fabricate

    return html


def run_phase5_part_B_reflection():
    # --- Task B1: Strategy check ---
    for slide in deck:
        assert slide_serves(strategy.audience, strategy.purpose)
        assert slide_supports(core_message)

    # --- Task B2: Substance / source-traceability audit ---
    all_facts = extract_facts_from_deck(deck)  # numbers, names, dates, quotes
    for fact in all_facts:
        source = trace_to_source_map_or_brief(fact)
        if source is None:
            issue(fact, "unsourced — cut or replace")

    # --- Task B3: Title Test ---
    titles = [s.title for s in deck]
    if not tells_coherent_story(titles):
        issue("titles fail Title Test", "rewrite to claim-shape")

    # --- Task B4: Surface check ---
    for slide in deck:
        # Squint test — reduced-size screenshot
        reduced = CALL capture_slide_screenshot(mode="region", scale=0.2)
        if main_point_not_visible(reduced):
            issue(slide, "hierarchy fails squint test")
        assert matches_design_summary(slide, design)

    # --- Task B5: Anti-slop audit ---
    for trope in anti_slop_checklist:
        matches = scan_deck_for(trope)
        for match in matches:
            issue(match, f"anti-slop: {trope}")

    # --- Task B6: Review summary ---
    review = group_by_layer(all_issues)
    fix_decisions = CALL unified_ask_user_question(
        per_issue_questions(review)
    )
    for issue, decision in fix_decisions:
        if decision == "Apply":
            CALL Edit(issue.slide, issue.fix)

    # Re-verify affected slides
    re_verify_touched_slides()

    # --- Task B7: Data-verify sub-agent (for high-stakes decks) ---
    if strategy.audience_type in ["board", "investor", "medical", "legal",
                                    "regulatory"]:
        offer = CALL unified_ask_user_question([
            {question: "Run data-accuracy verification against primary sources?",
             options: [{label: "Yes, verify"}, {label: "Skip"}]}
        ])
        if offer == "Yes":
            while True:
                CALL create_agent(
                    task_type="slides",
                    slides_subagent_role="data_verify",
                    share_slides_project=True,
                    query="Verify deck facts, write PASS/FIX verdict",
                    instructions=data_verify_instructions_template(),
                )
                verdict = CALL Read(f"review/{deck_slug}.md")
                fix_items = extract_fix_items(verdict)
                if not fix_items:
                    break
                for item in fix_items:
                    CALL Edit(item.slide, item.fix)
                # Dispatch FRESH sub-agent next iteration

    # --- Task B8: Handoff document ---
    handoff = render_handoff(
        strategy, core_message, source_map, design,
        applied_fixes, known_limitations
    )
    CALL Write(f"{deck_folder}/HANDOFF.md", handoff)

    # --- Final acceptance ---
    acceptance = CALL unified_ask_user_question([
        {question: "Accept the deck",
         options: [{label: "Accept — complete"},
                   {label: "More changes needed"}]}
    ])
    if acceptance == "Accept":
        STATE deck_complete = True
```

---

## Rollback logic (cross-phase)

```python
def enforce_layered_rollback(discovered_gap, current_phase):
    """When a downstream phase discovers an upstream gap, return to that phase."""

    if discovered_gap.type == "unsourced_claim":
        LOG "Content gap discovered — rolling back to Phase 2"
        STATE phase = "phase2"
        return run_phase2_substance(context)

    elif discovered_gap.type == "structural_incoherence":
        LOG "Structural gap discovered — rolling back to Phase 3"
        STATE phase = "phase3"
        return run_phase3_structure(context)

    elif discovered_gap.type == "visual_mismatch":
        LOG "Visual issue — revising Phase 4 spec"
        # Don't fully rollback — revise Phase 4 artifact and re-cascade
        revise_design_summary(discovered_gap)
        return

    elif discovered_gap.type == "strategic_drift":
        LOG "Strategic drift — rolling back to Phase 1"
        STATE phase = "phase1"
        return run_phase1_strategy(context)

    # Never patch upstream gaps in place
    assert False, "Improvised upstream fix attempted — refused"
```

---

## Question-tool binding (cross-cutting)

```python
def emit_question(question_text, options, top_pick=None):
    """Every question in Guide Mode goes through this."""

    # Enforce structure
    assert isinstance(question_text, str)
    assert len(question_text) < 100  # concise noun phrase
    assert "?" not in question_text  # no question mark
    assert isinstance(options, list)
    assert 2 <= len(options) <= 6  # single-select
    # (or 2 <= len <= 12 for multi-select)

    # Front-frame reasoning
    if not reasoning_shared_recently:
        analysis = analyze_current_understanding()
        EMIT analysis  # ≥1 paragraph or 3 bullets

    # Never plain-text questions in Guide Mode
    return CALL unified_ask_user_question([
        {question: question_text, options: options}
    ])
```

---

## Parallelism rules

```python
def parallel_group(*tool_calls):
    """Independent tool calls launched in one tool block."""

    # Common patterns
    PARALLEL(
        CALL check_slide_layout(...),
        CALL capture_slide_screenshot(...),
    )  # verification pair — ALWAYS parallel

    PARALLEL(
        CALL Write(slide1),
        CALL Write(slide2),
        CALL Write(slide3),
        CALL Write(slide4),
        CALL Write(slide5),
    )  # batch authoring — ALWAYS parallel

    PARALLEL(
        CALL Read(strategy_summary),
        CALL Read(source_map),
        CALL Read(outline_final),
    )  # multi-file context load — parallel

    # NEVER parallel
    # Sequential dependencies:
    CALL Read(source_map)
    → analyze
    → CALL Write(outline)  # depends on source_map contents
```

---

## Error handling patterns

```python
try:
    result = CALL some_tool(...)
except FileNotFound:
    if it_should_exist:
        re_dispatch_creator()
    else:
        proceed_with_fallback()

except TimeoutError:
    retry_once()
    if still_fails:
        note_in_review_summary()

except SizeExceeded:
    if user_attached_file:
        EMIT "File too large; ask user to compress or split"
    else:
        chunk_and_process()

except CanvasOverflow:
    # Slide content doesn't fit canvas
    # NEVER add overflow:auto or scroll
    reduce_content_or_shrink_gaps()
```

---

## The single-flow view

```python
# From a bird's eye:
user_input
  → phase1_strategy() → .guide/strategy-summary.md → GATE
  → phase2_substance() → source-map.md + core-message.md + brief → GATE
  → phase3_structure() → outline-final.md + kill-list.md → GATE
  → phase4_surface() → design-summary.md + brand-assets → GATE
  → phase5A_execution() → deck/**/*.html + verifications → SAMPLE GATE → full build → GATE
  → phase5B_reflection() → review + fixes + HANDOFF.md → FINAL GATE
  → deck_delivered
```

Every gate is `unified_ask_user_question`. Every artifact between phases is a file in the Project store. Every phase can trigger a rollback to any earlier phase.
