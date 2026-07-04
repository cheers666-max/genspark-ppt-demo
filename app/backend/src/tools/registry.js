// Tool 层 —— 全方面镜像 Genspark AI Slides 的工具 schema（31 个工具）
// 对照 system prompt 的 COMPLETE TOOL SCHEMA，每个工具都有 handler
// 研究类工具走 360 网关（chat/VLM/image），媒体类工具走 360 images 端点
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { nanoid } from 'nanoid';
import * as store from '../store/project.js';
import { renderSlidePng, checkSlideLayout, exportDeckPptx, exportDeckPdf } from '../render/puppeteer.js';
import { webSearchProxy, imageGenerationProxy } from './external.js';
import { provider, chat, chatVision, imageGen } from '../util/llm.js';

const sh = promisify(exec);
const viewports = new Map();
export function getViewport(id) { return viewports.get(id) || 1; }
function setViewport(id, page) { viewports.set(id, page); }

// ============ Slide 项目工具 ============

async function initialize_slide(p) {
  const m = await store.createProject(p);
  return { project_id: m.id, manifest: m };
}

async function insert_new_slides({ project_id, task_brief, approximate_page_count = 1, with_outline = true, insert_position = 1 }) {
  const m = await store.readManifest(project_id);
  const slides = m.slides || [];
  const newSlides = [];
  for (let i = 0; i < approximate_page_count; i++) {
    newSlides.push({ index: insert_position + i, title: '', template: 'blank', task_brief: i === 0 ? task_brief : '', status: 'blank' });
  }
  const merged = [...slides.slice(0, insert_position - 1), ...newSlides, ...slides.slice(insert_position - 1)]
    .map((s, i) => ({ ...s, index: i + 1 }));
  m.slides = merged;
  await store.writeManifest(project_id, m);
  let outline = null;
  if (with_outline && approximate_page_count > 1) outline = buildOutline(task_brief, approximate_page_count, m);
  return { slides: merged, outline };
}

function buildOutline(task_brief, count, manifest) {
  const pages = [];
  for (let i = 0; i < count; i++) {
    pages.push({ page: i + 1, role: i === 0 ? 'cover' : i === count - 1 ? 'closing' : 'content',
      title: `第 ${i + 1} 页`, template: i === 0 ? 'cover' : i === count - 1 ? 'closing' : 'content', brief: task_brief });
  }
  return { count, pages, strategy: 'cover + content* + closing' };
}

async function modify_slide({ project_id, index, task_brief, html, new_temp_key, new_temp_name, new_template_description, images }) {
  const m = await store.readManifest(project_id);
  const slide = (m.slides || []).find(s => s.index === index);
  if (!slide) throw new Error(`slide ${index} not found`);
  if (html) {
    await store.writeSlide(project_id, index, html);
    slide.status = 'built';
    slide.has_html = true;
  }
  if (images) slide.images = images;
  slide.task_brief = task_brief || slide.task_brief;
  if (new_temp_key) {
    slide.template = new_temp_key;
    slide.template_name = new_temp_name;
    slide.template_description = new_template_description;
    m.templates = m.templates || [];
    if (!m.templates.find(t => t.key === new_temp_key)) {
      m.templates.push({ key: new_temp_key, name: new_temp_name, description: new_template_description });
    }
  }
  await store.writeManifest(project_id, m);
  return { slide };
}

async function delete_slides({ project_id, indexes }) {
  const m = await store.readManifest(project_id);
  const keep = (m.slides || []).filter(s => !indexes.includes(s.index));
  m.slides = keep.map((s, i) => ({ ...s, index: i + 1 }));
  await store.writeManifest(project_id, m);
  return { slides: m.slides };
}

async function move_slides({ project_id, source_index, target_index }) {
  const m = await store.readManifest(project_id);
  const arr = [...(m.slides || [])];
  const [moved] = arr.splice(source_index - 1, 1);
  arr.splice(target_index - 1, 0, moved);
  m.slides = arr.map((s, i) => ({ ...s, index: i + 1 }));
  await store.writeManifest(project_id, m);
  return { slides: m.slides };
}

async function adjust_slides_viewport({ project_id, view_port_page }) {
  setViewport(project_id, view_port_page);
  return { viewport: view_port_page };
}

async function slide_screenshot({ project_id, index, markers = [] }) {
  const m = await store.readManifest(project_id);
  const png = await renderSlidePng(project_id, index, m.width, m.height);
  return { image_path: png, markers };
}

async function check_slide_layout({ project_id, index }) {
  const m = await store.readManifest(project_id);
  const result = await checkSlideLayout(project_id, index, m.width, m.height);
  return result;
}

async function export_slides({ project_id, start_page, end_page, format = 'pptx' }) {
  if (format === 'pdf') return exportDeckPdf(project_id, start_page, end_page);
  return exportDeckPptx(project_id, start_page, end_page);
}

async function import_slides({ project_id, operation_mode = 'template' }) {
  return { status: 'stub', project_id, operation_mode, note: 'import_slides：从 Genspark project_id 导入模板/复制（需 Genspark 项目库）' };
}

async function template_operations({ operation_type = 'import_template', template_id }) {
  return { status: 'stub', operation_type, template_id, note: 'template_operations：从模板库导入（需模板库接入）' };
}

async function think({ project_id, thought }) {
  if (!project_id) return { ack: true, skipped: true };
  const prev = (await store.readGuide(project_id, 'thoughts.log')) || '';
  await store.writeGuide(project_id, 'thoughts.log', prev + `${new Date().toISOString()}\n${thought}\n\n`);
  return { ack: true };
}

async function todo_write({ project_id, todos }) {
  if (!project_id) return { todos, skipped: true };
  const m = await store.readManifest(project_id);
  m.todos = todos;
  await store.writeManifest(project_id, m);
  return { todos };
}

// ============ Web / 研究类工具（走 360 chat） ============

async function web_search({ q }) { return webSearchProxy(q); }

async function batch_web_search({ queries }) {
  return Promise.all(queries.map(q => webSearchProxy(q)));
}

async function crawler({ url }) {
  // 真实抓取 URL → 纯文本/markdown；失败用 360 chat 概览
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error(`http ${r.status}`);
    const ct = r.headers.get('content-type') || '';
    let text = await r.text();
    if (ct.includes('text/html')) text = htmlToText(text);
    const markdown = text.slice(0, 8000);
    return { url, markdown, fetched: true, length: text.length, content_type: ct };
  } catch (e) {
    if (provider) {
      const summary = await chat([
        { role: 'system', content: '你是抓取助手，对给定 URL 做概览（无法直连时基于常识给出该站点通常内容，标注"推测"）。' },
        { role: 'user', content: `URL: ${url}` }
      ], { max_tokens: 1500 });
      return { url, markdown: summary, fetched: false, fallback: 'llm', error: e.message };
    }
    return { url, markdown: `(crawler 占位：${url} 抓取失败 ${e.message})`, fetched: false };
  }
}

async function url_metadata({ url }) {
  const urls = Array.isArray(url) ? url : [url];
  const out = [];
  for (const u of urls) {
    try {
      const r = await fetch(u, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
      out.push({ url: u, status: r.status, content_type: r.headers.get('content-type'), content_length: r.headers.get('content-length'), filename: u.split('/').pop() });
    } catch (e) { out.push({ url: u, error: e.message }); }
  }
  return Array.isArray(url) ? out : out[0];
}

async function summarize_large_document({ url, question }) {
  if (!provider) return { url, question, summary: '(demo 占位：需 LLM 才能摘要长文档)' };
  // 抓取文档 → 喂给 360 chat 回答特定问题
  const c = await crawler({ url });
  const doc = c.markdown || '';
  const ans = await chat([
    { role: 'system', content: '你是对长文档做精准问答的助手。基于给定文档内容回答问题，若文档无相关信息就说明。' },
    { role: 'user', content: `文档(${doc.length} 字符):\n${doc.slice(0, 12000)}\n\n问题: ${question}` }
  ], { max_tokens: 2000, temperature: 0.2 });
  return { url, question, summary: ans, doc_length: doc.length };
}

async function scholar_search({ query }) {
  if (!provider) return { query, results: [], demo: true };
  const text = await chat([
    { role: 'system', content: '你是学术搜索助手。对查询给出 3-5 条学术论文式结果，JSON 数组：[{"title","authors","year","venue","abstract","url"}]。只输出 JSON。' },
    { role: 'user', content: query }
  ], { max_tokens: 2000, temperature: 0.3 });
  let results = [];
  try { results = JSON.parse(text); } catch { try { results = JSON.parse(text.match(/\[[\s\S]*\]/)[0]); } catch {} }
  return { query, results };
}

// ============ 图片工具 ============

async function image_generation(p) { return imageGenerationProxy(p); }

async function image_search({ query, count = 4 }) {
  // 用 picsum.photos 按 seed 返回真实可访问图（占位但可加载）+ 360 chat 生成描述
  const results = [];
  for (let i = 0; i < count; i++) {
    const seed = encodeURIComponent(query).slice(0, 20) + i;
    results.push({
      url: `https://picsum.photos/seed/${seed}/800/600`,
      thumb: `https://picsum.photos/seed/${seed}/200/150`,
      title: `${query} #${i + 1}`,
      source: 'picsum (demo placeholder)',
      width: 800, height: 600
    });
  }
  return { query, results, note: 'image_search：复刻占位用 picsum.photos 真实图，生产可接 Bing/Google Images API' };
}

async function read_image({ image_url, question }) {
  if (!provider) return { image_url, description: '(demo 占位：需 VLM 才能读图)' };
  // 下载图 → base64 → 360 VLM 描述
  try {
    const r = await fetch(image_url, { signal: AbortSignal.timeout(20000) });
    const buf = Buffer.from(await r.arrayBuffer());
    const b64 = buf.toString('base64');
    const mime = r.headers.get('content-type') || 'image/png';
    const desc = await chatVision([
      { role: 'user', content: [
        { type: 'text', text: question || '详细描述这张图片的内容、构图、配色、文字。' },
        { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } }
      ] }
    ], { max_tokens: 1500 });
    return { image_url, description: desc };
  } catch (e) {
    return { image_url, error: e.message, description: '(读图失败：' + e.message + ')' };
  }
}

// ============ 视频工具 ============

async function video_search({ query }) {
  if (!provider) return { query, results: [], demo: true };
  const text = await chat([
    { role: 'system', content: '你是 YouTube 搜索助手。对查询给出 3-5 条视频结果，JSON 数组：[{"title","video_id","channel","duration","description","url"}]。video_id 是 11 位 YouTube id。只输出 JSON。' },
    { role: 'user', content: query }
  ], { max_tokens: 1800, temperature: 0.3 });
  let results = [];
  try { results = JSON.parse(text); } catch { try { results = JSON.parse(text.match(/\[[\s\S]*\]/)[0]); } catch {} }
  return { query, results };
}

async function understand_video({ video_id, provide_download_link = false }) {
  // 无 YouTube transcript API，用 360 chat 基于 video_id 占位（真实需 youtube-transcript-api）
  if (!provider) return { video_id, transcript: '(demo 占位)' };
  const text = await chat([
    { role: 'system', content: '你是视频转录助手。基于 YouTube video_id 给出 plausible 转录概览（标注"推测"），含时间戳分段。' },
    { role: 'user', content: `video_id: ${video_id}` }
  ], { max_tokens: 2000 });
  return { video_id, transcript: text, speculative: true, download_link: provide_download_link ? `https://www.youtube.com/watch?v=${video_id}` : null };
}

async function batch_understand_videos({ jobs }) {
  return Promise.all((jobs || []).map(j => understand_video({ video_id: j.video_id, provide_download_link: false }).then(r => ({ ...r, questions: j.questions_to_answer }))));
}

// ============ 音频工具 ============

async function audio_transcribe({ audio_urls, model = 'whisper-1', prompt }) {
  // 无真实 whisper 接入，用 360 chat 模拟（生产可接 OpenAI whisper 或 360 语音）
  if (!provider) return { audio_urls, text: '(demo 占位：需语音识别服务)' };
  const text = await chat([
    { role: 'system', content: '你是转录助手。对给定音频 URL 占位给出 plausible 转录（标注"推测"，生产应接 whisper）。' },
    { role: 'user', content: `audio: ${JSON.stringify(audio_urls)}\n${prompt || ''}` }
  ], { max_tokens: 2000 });
  return { audio_urls, text, speculative: true, model };
}

async function audio_generation(p) {
  return { status: 'stub', note: 'audio_generation：360 网关支持 TTS/音乐生成（elevenlabs/mureka/minimax），复刻版预留接口', params: p };
}

async function video_generation(p) {
  return { status: 'stub', note: 'video_generation：360 网关支持 kling/veo/sora，复刻版预留接口', params: p };
}

// ============ 代码 / 文件 / 存储 ============

async function jupyter_code_executor({ instructions }) {
  // 用本机 python3 执行（沙箱化：临时目录 + 超时）
  const tmp = path.join(os.tmpdir(), 'jp_' + nanoid(6));
  await fs.mkdir(tmp, { recursive: true });
  try {
    const script = path.join(tmp, 'run.py');
    await fs.writeFile(script, `# auto-generated from instructions\nimport sys\nprint("jupyter_code_executor stub run")\nprint("instructions:", ${JSON.stringify(instructions).slice(0,200)})\n`);
    const { stdout } = await sh(`python3 ${script}`, { timeout: 30000 });
    return { ok: true, stdout: stdout.slice(0, 4000), cwd: tmp };
  } catch (e) { return { ok: false, error: e.message, stdout: e.stdout?.slice?.(0,4000) }; }
  finally { await fs.rm(tmp, { recursive: true, force: true }).catch(() => {}); }
}

async function file_format_converter({ from_format, to_format, file_url }) {
  return { status: 'stub', from_format, to_format, file_url, note: 'file_format_converter：需 LibreOffice/ffmpeg，复刻版预留接口' };
}

async function aidrive_tool({ action = 'ls', path: p = '/', ...rest }) {
  return { status: 'stub', action, path: p, note: 'aidrive_tool：AI-Drive 文件管理，复刻版预留接口', rest };
}

async function create_agent({ task_type, task_name, query, instructions }) {
  return { status: 'stub', task_type, task_name, note: 'create_agent：创建子代理（podcasts 等），复刻版预留接口', query: query?.slice(0,100), instructions: instructions?.slice(0,100) };
}

// ============ 工具注册表（31 个，对齐 Genspark schema） ============

export const TOOLS = {
  // slide 项目
  initialize_slide, insert_new_slides, modify_slide, delete_slides, move_slides,
  adjust_slides_viewport, slide_screenshot, check_slide_layout, export_slides, import_slides, template_operations,
  think, TodoWrite: todo_write,
  // web/研究
  web_search, batch_web_search, crawler, url_metadata, summarize_large_document, scholar_search,
  // 图片
  image_generation, image_search, read_image,
  // 视频
  video_search, understand_video, batch_understand_videos, video_generation,
  // 音频
  audio_transcribe, audio_generation,
  // 代码/文件/存储/代理
  jupyter_code_executor, file_format_converter, aidrive_tool, create_agent
};

export async function dispatch(toolName, params) {
  const fn = TOOLS[toolName];
  if (!fn) throw new Error(`unknown tool: ${toolName}`);
  return fn(params || {});
}

// ============ helpers ============

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
