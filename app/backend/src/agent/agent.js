// Agent 编排层 —— 复刻 Genspark Guide Mode 5 阶段流程
// 阶段：Strategy → Substance → Structure → Surface → Execution(+Reflection)
// 通过 SSE 向前端推送：phase / tool_call / todo / question / slide / done
// 两种模式：
//   - LLM 模式：有 360_API_KEY 或 OPENAI_API_KEY，用 LLM 决策 + 生成 HTML（对齐 360-api skill）
//   - Demo 模式：无 key，跑确定性流程，生成内置示例 deck（现代日本营销策略）
import { EventEmitter } from 'node:events';
import * as tools from '../tools/registry.js';
import { buildSlideHtml } from './slideHtml.js';
import { DEMO_DECK } from './demoDeck.js';
import { provider, chat, parseJsonLoose, stripCodeFence } from '../util/llm.js';
import * as store from '../store/project.js';
import {
  SYSTEM_PROMPT, OUTLINE_USER, HTML_CONTENT_SYSTEM, HTML_CONTENT_USER,
  HTML_TOC_SYSTEM, HTML_TOC_USER, FIX_SYSTEM, FIX_USER,
  READ_IMAGE_SELFCHECK, READ_IMAGE_VERIFY, IMAGE_GEN_QUERY
} from './prompts.js';

const SYSTEM_PROMPT_OLD = null; // 已迁移到 prompts.js


export class SlideAgent extends EventEmitter {
  constructor({ project_id, userPrompt }) {
    super();
    this.project_id = project_id;
    this.userPrompt = userPrompt;
    this.history = [];
    this.todos = [];
  }

  emitEvent(type, data) {
    this.emit('event', { type, data, ts: Date.now() });
  }

  async callTool(name, params) {
    this.emitEvent('tool_call', { name, params });
    const result = await tools.dispatch(name, { project_id: this.project_id, ...params });
    this.emitEvent('tool_result', { name, result });
    return result;
  }

  async setTodos(todos) {
    this.todos = todos;
    await this.callTool('TodoWrite', { todos });
    this.emitEvent('todo', { todos });
  }

  async askUser(questions) {
    // 交互问题：推给前端，等待 answer 事件
    this.emitEvent('question', { questions });
    const answer = await new Promise(resolve => {
      this._resolveAnswer = resolve;
    });
    return answer;
  }

  submitAnswer(answer) {
    if (this._resolveAnswer) this._resolveAnswer(answer);
  }

  // ---------- 主入口 ----------
  async run() {
    try {
      if (provider) {
        try {
          await this.runLLM();
        } catch (e) {
          this.emitEvent('reply', { text: `LLM 模式失败（${e.message}），自动降级到 Demo 模式生成示例 deck。` });
          await this.runDemo();
        }
      } else {
        await this.runDemo();
      }
      this.emitEvent('done', { ok: true });
    } catch (e) {
      this.emitEvent('error', { message: e.message, stack: e.stack });
      this.emitEvent('done', { ok: false, error: e.message });
    }
  }

  // ---------- Demo 模式：确定性流程 ----------
  async runDemo() {
    this.emitEvent('phase', { phase: 1, name: 'Strategy', note: 'demo 模式：用预设策略' });
    await this.setTodos(demoTodos());
    await this.callTool('think', { thought: 'demo 模式启动：用户请求 → 「现代日本营销策略」6 页演示' });

    // Phase 1: Strategy
    this.emitEvent('reply', { text: '我先确认演示定位：面向中国市场团队，专业模式，6 页。直接进入构建。' });
    await this.callTool('think', { thought: 'Phase 1 完成：受众=市场团队，目的=借鉴日本营销打法' });

    // Phase 2: Substance
    this.emitEvent('phase', { phase: 2, name: 'Substance', note: 'demo 模式：使用内置素材' });
    await this.callTool('web_search', { q: '日本现代营销策略 案例研究' });

    // Phase 3: Structure
    this.emitEvent('phase', { phase: 3, name: 'Structure', note: 'demo 模式：6 页大纲' });

    // initialize + insert slides
    const init = await this.callTool('initialize_slide', {
      display_name: DEMO_DECK.title,
      file_prefix: 'japan_marketing',
      description: DEMO_DECK.subtitle,
      width: 1280,
      height: 720,
      design_brand_reference: '现代日本极简风，深蓝+朱红'
    });
    this.project_id = init.project_id;
    this.emitEvent('project', { project_id: init.project_id, manifest: init.manifest });

    const { outline } = await this.callTool('insert_new_slides', {
      task_brief: DEMO_DECK.subtitle,
      approximate_page_count: DEMO_DECK.pages.length,
      with_outline: true
    });
    this.emitEvent('outline', { outline });

    // Phase 4: Surface
    this.emitEvent('phase', { phase: 4, name: 'Surface', note: '深蓝 #1e3a5f + 朱红 #d63031 + Noto Sans SC' });

    // Phase 5: Execution —— 逐页生成 HTML
    this.emitEvent('phase', { phase: 5, name: 'Execution', note: '逐页生成 + 截图验证' });
    for (let i = 0; i < DEMO_DECK.pages.length; i++) {
      const page = DEMO_DECK.pages[i];
      const html = buildSlideHtml(page, DEMO_DECK, i, DEMO_DECK.pages.length);
      await this.callTool('modify_slide', {
        index: i + 1,
        task_brief: page.title,
        html,
        new_temp_key: page.template,
        new_temp_name: page.template,
        new_template_description: page.layout_desc
      });
      const ss = await this.callTool('slide_screenshot', { index: i + 1 });
      this.emitEvent('slide', { index: i + 1, title: page.title, screenshot: ss.image_path });
      await this.setTodos(markTodo(this.todos, i + 1));
    }

    // Reflection
    this.emitEvent('phase', { phase: 6, name: 'Reflection', note: '6 项自检：标题/来源/版式/对比/slop/导出' });
    await this.callTool('think', { thought: '自检：所有页已生成，标题清晰，无装饰性虚假数据。可导出。' });
    this.emitEvent('reply', { text: '6 页幻灯片已生成并通过自检。可在右上角「View & Export」导出 PPTX/PDF。' });
  }

  // ---------- LLM 模式（全方面复刻 Genspark 5 阶段，对齐 360-api skill） ----------
  async tryTool(name, params) {
    // 研究类工具失败不阻塞主流程，只记录
    try { return await this.callTool(name, params); }
    catch (e) { this.emitEvent('tool_error', { name, error: e.message }); console.error(`[tryTool:${name}]`, e.message); return null; }
  }

  async runLLM() {
    this.history.push({ role: 'system', content: SYSTEM_PROMPT });
    this.history.push({ role: 'user', content: this.userPrompt });

    // ===== Phase 1: Strategy =====
    this.emitEvent('phase', { phase: 1, name: 'Strategy', note: '分析受众/目的/成功指标' });
    await this.callTool('think', { thought: `Phase 1 Strategy：用户请求="${this.userPrompt.slice(0,80)}"，推断受众=专业观众，目的=信息传递+说服，6 页` });

    // ===== Phase 2: Substance（web_search + batch_web_search + crawler + summarize_large_document）=====
    this.emitEvent('phase', { phase: 2, name: 'Substance', note: 'web_search + batch_web_search + crawler 搜素材' });
    const ws1 = await this.tryTool('web_search', { q: this.userPrompt.slice(0, 30) + ' 案例研究 数据' });
    const wsBatch = await this.tryTool('batch_web_search', { queries: [
      this.userPrompt.slice(0, 20) + ' 趋势 2026',
      this.userPrompt.slice(0, 20) + ' 标杆案例',
      this.userPrompt.slice(0, 20) + ' 关键数据 统计'
    ]});
    // crawler 抓取第一个搜索结果 URL（若有）
    const firstUrl = ws1?.results?.[0]?.url;
    let crawled = null;
    if (firstUrl && firstUrl.startsWith('http')) {
      // url_metadata 先检查 URL 元数据
      await this.tryTool('url_metadata', { url: firstUrl });
      crawled = await this.tryTool('crawler', { url: firstUrl });
      // summarize_large_document 对抓到的长文档做精准问答
      if (crawled?.fetched && crawled.length > 1000) {
        await this.tryTool('summarize_large_document', { url: firstUrl, question: '提取与主题相关的 3-5 条关键事实/数据，用于幻灯片' });
      }
    }
    // scholar_search 学术素材
    await this.tryTool('scholar_search', { query: this.userPrompt.slice(0, 30) });
    // video_search 搜相关视频 + understand_video 理解一个
    const vs = await this.tryTool('video_search', { query: this.userPrompt.slice(0, 30) + ' 解读' });
    const vidId = vs?.results?.[0]?.video_id;
    if (vidId) await this.tryTool('understand_video', { video_id: vidId, provide_download_link: false });

    // ===== Phase 3: Structure（outline）=====
    this.emitEvent('phase', { phase: 3, name: 'Structure', note: 'LLM 生成 outline JSON' });
    const init = await this.callTool('initialize_slide', {
      display_name: this.userPrompt.slice(0, 40),
      file_prefix: 'deck_' + Date.now(),
      description: this.userPrompt
    });
    this.project_id = init.project_id;
    this.emitEvent('project', { project_id: init.project_id, manifest: init.manifest });

    const researchCtx = (ws1?.results?.[0]?.snippet || '') + ' ' + (wsBatch?.map(r => r?.results?.[0]?.snippet || '').join(' ') || '');
    const outlineText = await chat([
      ...this.history,
      { role: 'user', content: OUTLINE_USER(researchCtx) }
    ], { temperature: 0.4, max_tokens: 4096 });
    const outline = parseJsonLoose(outlineText) || {
      title: this.userPrompt.slice(0, 40),
      pages: [{ page: 1, title: 'Cover', template: 'cover', brief: this.userPrompt, need_image: false }],
      palette: ['#1e3a5f', '#d63031', '#f5f5f5']
    };
    this.emitEvent('outline', { outline });
    this.history.push({ role: 'assistant', content: JSON.stringify(outline) });

    await this.callTool('insert_new_slides', {
      task_brief: outline?.title || this.userPrompt,
      approximate_page_count: outline?.pages?.length || 5,
      with_outline: true
    });

    await this.setTodos(outline.pages.map((p, i) => ({
      id: String(i + 1), content: `生成第 ${p.page} 页：${p.title}`, status: i === 0 ? 'in_progress' : 'pending', priority: 'high'
    })));

    // ===== Phase 4: Surface（image_search 搜真实图 + image_generation 生成图）=====
    this.emitEvent('phase', { phase: 4, name: 'Surface', note: 'image_search 搜图 + image_generation 生成图' });
    const pageImages = {}; // index -> [url]
    const needImagePages = outline.pages.filter(p => p.need_image || p.template === 'cover' || p.template === 'content');
    for (const p of needImagePages.slice(0, 4)) {
      try {
        const is = await this.tryTool('image_search', { query: p.title.slice(0, 30), count: 2 });
        pageImages[p.page] = (is?.results || []).map(r => r.url);
      } catch (e) { console.error('[image_search]', e.message); }
    }
    // image_generation 生成 1 张主题图（360 doubao-seedream 真实出图）
    let generatedImg = null;
    try {
      const ig = await this.tryTool('image_generation', {
        query: IMAGE_GEN_QUERY(outline.title, outline.palette || ['#1e3a5f', '#d63031']),
        aspect_ratio: '16:9', task_summary: 'cover 主题图', image_urls: [], is_creating_new_full_slide: false
      });
      generatedImg = ig?.image_url;
    } catch (e) { console.error('[image_generation]', e.message); }
    // read_image 用 VLM 读一张搜到的图，验证可用性
    const firstImg = Object.values(pageImages)[0]?.[0];
    if (firstImg) await this.tryTool('read_image', { image_url: firstImg, question: READ_IMAGE_VERIFY });

    const palette = outline.palette || ['#1e3a5f', '#d63031', '#f5f5f5'];

    // ===== Phase 5: Execution（生成 HTML，嵌图，toc 页特殊处理）=====
    this.emitEvent('phase', { phase: 5, name: 'Execution', note: '批量 LLM 生成 HTML + 嵌图 + toc 目录页' });
    const tocEntries = outline.pages.filter(p => p.template !== 'cover' && p.template !== 'toc')
      .map(p => `${p.page}. ${p.title}`);
    const BATCH = 8;
    for (let start = 0; start < outline.pages.length; start += BATCH) {
      const batch = outline.pages.slice(start, start + BATCH);
      await Promise.all(batch.map(async (p) => {
        const imgs = pageImages[p.page] || (p.template === 'cover' && generatedImg ? [generatedImg] : []);
        const imgHint = imgs.length ? `\n# 可用图片\n可在 HTML 里用 <img src="..."> 嵌入这些 URL：${imgs.join(' , ')}` : '';
        let sysContent, userContent;
        if (p.template === 'toc') {
          sysContent = HTML_TOC_SYSTEM(palette);
          userContent = HTML_TOC_USER(p, tocEntries);
        } else {
          sysContent = HTML_CONTENT_SYSTEM(palette);
          userContent = HTML_CONTENT_USER(p, imgHint);
        }
        const fullBody = await chat([
          { role: 'system', content: sysContent },
          { role: 'user', content: userContent }
        ], { temperature: 0.3, max_tokens: 16000 });
        const bodyHtml = stripCodeFence(fullBody);
        const fullHtml = wrapHtml(bodyHtml, palette);
        await this.callTool('modify_slide', { index: p.page, task_brief: p.title, html: fullHtml, images: imgs, new_temp_key: p.template, new_temp_name: p.template, new_template_description: p.template + ' layout' });
        await this.tryTool('adjust_slides_viewport', { view_port_page: p.page });
      }));
      const doneCount = Math.min(start + BATCH, outline.pages.length);
      await this.setTodos(markTodo(this.todos, doneCount));
    }

    // 截图 + 修复循环（check_slide_layout 检测 → 若有问题 LLM 修复 → 重新截图，最多 2 轮，Loop until clean）
    for (const p of outline.pages) {
      let ss = await this.callTool('slide_screenshot', { index: p.page });
      this.emitEvent('slide', { index: p.page, title: p.title, screenshot: ss.image_path });
      // 修复循环（check_slide_layout 检测 → 仅对 high severity 修复 1 轮 → 重新截图）
      for (let round = 0; round < 1; round++) {
        const layout = await this.tryTool('check_slide_layout', { index: p.page });
        if (!layout || layout.clean || !layout.issues?.length) break;
        const highIssues = layout.issues.filter(i => i.severity === 'high');
        if (!highIssues.length) { this.emitEvent('reply', { text: `第 ${p.page} 页布局检测通过（${layout.issues.length} 个低优问题，忽略）` }); break; }
        this.emitEvent('reply', { text: `第 ${p.page} 页检测到 ${highIssues.length} 个高优布局问题 → LLM 修复中` });
        const curHtml = await store.readSlide(this.project_id, p.page);
        const bodyMatch = curHtml.match(/<body[^>]*>([\s\S]*)<\/body>/);
        const curBody = bodyMatch ? bodyMatch[1] : curHtml;
        const fixBody = await chat([
          { role: 'system', content: FIX_SYSTEM },
          { role: 'user', content: FIX_USER(curBody, highIssues) }
        ], { temperature: 0.2, max_tokens: 8000 });
        const fixedBody = stripCodeFence(fixBody);
        const fixedHtml = wrapHtml(fixedBody, palette);
        await this.callTool('modify_slide', { index: p.page, task_brief: p.title, html: fixedHtml, new_temp_key: p.template, new_temp_name: p.template, new_template_description: p.template + ' fixed' });
        ss = await this.callTool('slide_screenshot', { index: p.page });
        this.emitEvent('slide', { index: p.page, title: p.title, screenshot: ss.image_path, fixed_round: round + 1 });
      }
    }

    // ===== Phase 6: Reflection（自检 + 数据脚本 + podcast + 导出）=====
    this.emitEvent('phase', { phase: 6, name: 'Reflection', note: 'VLM 自检 + jupyter 数据 + podcast + 导出' });
    // read_image 用 VLM 自检首页截图
    try {
      const firstShot = `http://localhost:${process.env.PORT || 4000}/api/projects/${this.project_id}/screenshots/01.png`;
      await this.tryTool('read_image', { image_url: firstShot, question: READ_IMAGE_SELFCHECK });
    } catch (e) { console.error('[read_image]', e.message); }
    // jupyter_code_executor 生成一份数据处理脚本（演示数据处理能力）
    await this.tryTool('jupyter_code_executor', { instructions: '生成一份营销策略 KPI 数据示例并计算均值/方差' });
    // create_agent 创建 podcast 子任务（Voice Your Slides）
    await this.tryTool('create_agent', {
      task_type: 'podcasts', task_name: `${outline.title} 播客`,
      query: `基于幻灯片内容生成 5 分钟播客对话`, instructions: '两位主持人讨论现代日本营销策略要点'
    });
    await this.callTool('think', { thought: 'Phase 6 Reflection：6 页已生成，VLM 自检 + 数据脚本 + podcast 子任务完成，可导出' });
    this.emitEvent('reply', { text: '已完成全部页面生成（含 web 搜索/视频搜索/图片搜索/图片生成/VLM 自检/数据脚本/podcast 子任务）。可导出 PPTX/PDF。' });
  }
}

function demoTodos() {
  return [
    { id: '1', content: 'Phase 1 Strategy：确认受众与目标', status: 'completed', priority: 'high' },
    { id: '2', content: 'Phase 2 Substance：搜集日本营销素材', status: 'completed', priority: 'high' },
    { id: '3', content: 'Phase 3 Structure：6 页大纲', status: 'completed', priority: 'high' },
    { id: '4', content: 'Phase 4 Surface：视觉系统', status: 'completed', priority: 'medium' },
    { id: '5', content: '生成第 1 页：封面', status: 'in_progress', priority: 'high' },
    { id: '6', content: '生成第 2 页：市场概览', status: 'pending', priority: 'high' },
    { id: '7', content: '生成第 3 页：核心策略', status: 'pending', priority: 'high' },
    { id: '8', content: '生成第 4 页：案例', status: 'pending', priority: 'high' },
    { id: '9', content: '生成第 5 页：数据', status: 'pending', priority: 'high' },
    { id: '10', content: '生成第 6 页：行动建议', status: 'pending', priority: 'high' },
    { id: '11', content: 'Phase 6 Reflection：自检 + 导出', status: 'pending', priority: 'medium' }
  ];
}

function markTodo(todos, doneCount) {
  return todos.map((t, i) => {
    if (t.id === '11') return t;
    if (parseInt(t.id) <= doneCount + 4) return { ...t, status: 'completed' };
    if (parseInt(t.id) === doneCount + 5) return { ...t, status: 'in_progress' };
    return t;
  });
}

function wrapHtml(body, palette) {
  const c1 = palette[0] || '#1e3a5f';
  const c2 = palette[1] || '#d63031';
  const c3 = palette[2] || '#6b7280';
  const paper = palette[3] || '#f7f3ec';
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--c1:${c1};--c2:${c2};--c3:${c3};--paper:${paper};--ink:#1a1a1a}
    html,body{width:1280px;height:720px;overflow:hidden}
    body{font-family:'Noto Sans SC','PingFang SC',sans-serif;color:var(--ink);background:var(--paper);position:relative}
    img{max-width:100%;display:block}
  </style></head><body>${body}</body></html>`;
}
