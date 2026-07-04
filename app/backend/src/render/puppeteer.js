// Puppeteer 渲染层：slide 截图 + deck 导出 PPTX/PDF
// 截图用于"看见"slide 真实渲染（Genspark 的 slide_screenshot 用途）
import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';
import * as store from '../store/project.js';

let _browser;
async function browser() {
  if (!_browser) {
    _browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'], protocolTimeout: 60000 });
  }
  return _browser;
}

async function withPage(fn) {
  const b = await browser();
  const page = await b.newPage();
  try {
    return await fn(page);
  } finally {
    await page.close();
  }
}

export async function renderSlidePng(project_id, index, width = 1280, height = 720) {
  const html = await store.readSlide(project_id, index);
  if (!html) throw new Error(`slide ${index} has no html`);
  const dir = path.join(store.projectDir(project_id), 'screenshots');
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${String(index).padStart(2, '0')}.png`);
  await withPage(async page => {
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    // domcontentloaded 不等外网字体；软等字体 2s 上限，避免 networkidle0 卡死
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 3000 }).catch(() => {});
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width, height }, timeout: 15000 });
  });
  return `/api/projects/${project_id}/screenshots/${String(index).padStart(2, '0')}.png`;
}

// 几何布局检测（对齐 Genspark check_slide_layout）：溢出 viewport + 文字遮挡
export async function checkSlideLayout(project_id, index, width = 1280, height = 720) {
  const html = await store.readSlide(project_id, index);
  if (!html) throw new Error(`slide ${index} has no html`);
  return withPage(async page => {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForNetworkIdle({ idleTime: 300, timeout: 2000 }).catch(() => {});
    const issues = await page.evaluate((W, H) => {
      const out = [];
      const els = Array.from(document.body.querySelectorAll('*'));
      const rects = [];
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        rects.push({ el, r, text: (el.textContent || '').trim().slice(0, 40) });
      }
      // 1. 溢出 viewport
      for (const { r, text } of rects) {
        if (r.right > W + 2 || r.bottom > H + 2 || r.left < -2 || r.top < -2) {
          if (text || r.width > 20) {
            out.push({ type: 'overflow', severity: 'high',
              msg: `元素溢出 viewport (${Math.round(r.left)},${Math.round(r.top)} - ${Math.round(r.right)},${Math.round(r.bottom)})`,
              text });
          }
        }
      }
      // 2. 文字元素被其他元素遮挡（简化：检测 z 重叠且文字一致）
      const textEls = rects.filter(x => x.text && x.text.length > 3 && x.r.width < W * 0.9);
      for (let i = 0; i < textEls.length; i++) {
        for (let j = i + 1; j < textEls.length; j++) {
          const a = textEls[i].r, b = textEls[j].r;
          const overlap = !(a.right < b.left + 5 || a.left > b.right - 5 || a.bottom < b.top + 5 || a.top > b.bottom - 5);
          if (overlap && textEls[i].text === textEls[j].text) {
            out.push({ type: 'overlap_duplicate', severity: 'medium',
              msg: `重复文字元素重叠: "${textEls[i].text.slice(0,20)}"`, text: textEls[i].text });
          }
        }
      }
      // 3. 字体过小
      for (const { el, text } of rects) {
        if (!text) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs > 0 && fs < 10) out.push({ type: 'small_font', severity: 'low', msg: `字体过小 ${fs}px`, text });
      }
      return out;
    }, width, height);
    return { index, issues, issue_count: issues.length, clean: issues.length === 0 };
  });
}

export async function exportDeckPdf(project_id, start_page, end_page) {
  const m = await store.readManifest(project_id);
  const slides = (m.slides || []).filter(s => s.has_html);
  const range = slides.filter(s => (!start_page || s.index >= start_page) && (!end_page || s.index <= end_page));
  const dir = path.join(store.projectDir(project_id), 'exports');
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${m.file_prefix}.pdf`);
  await withPage(async page => {
    await page.setViewport({ width: m.width, height: m.height });
    // 单页 PDF 合并：逐页 setContent + PDF 拼接简化为多页单文件需 pdf-lib；
    // 这里用 puppeteer 单页 PDF 然后用系统 print-to-pdf 多页通过临时 HTML 合并
    const combined = await buildCombinedHtml(project_id, range, m);
    await page.setContent(combined, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 5000 }).catch(() => {});
    await page.pdf({ path: file, width: `${m.width}px`, height: `${m.height}px`, printBackground: true, timeout: 60000 });
  });
  return { url: `/api/projects/${project_id}/exports/${m.file_prefix}.pdf`, format: 'pdf' };
}

export async function exportDeckPptx(project_id, start_page, end_page) {
  // PPTX：每页 PNG -> 嵌入 PPTX 幻灯片。用最小 PPTX 生成（基于一张全图）
  const m = await store.readManifest(project_id);
  const slides = (m.slides || []).filter(s => s.has_html);
  const range = slides.filter(s => (!start_page || s.index >= start_page) && (!end_page || s.index <= end_page));
  const dir = path.join(store.projectDir(project_id), 'exports');
  await fs.mkdir(dir, { recursive: true });

  // 先渲染每页 PNG
  const pngs = [];
  for (const s of range) {
    const url = await renderSlidePng(project_id, s.index, m.width, m.height);
    pngs.push({ index: s.index, abs: path.join(store.projectDir(project_id), 'screenshots', `${String(s.index).padStart(2, '0')}.png`) });
  }

  const file = path.join(dir, `${m.file_prefix}.pptx`);
  await buildPptx(pngs, m, file);
  return { url: `/api/projects/${project_id}/exports/${m.file_prefix}.pptx`, format: 'pptx' };
}

async function buildCombinedHtml(project_id, range, m) {
  const parts = [];
  for (const s of range) {
    const html = await store.readSlide(project_id, s.index);
    parts.push(`<section style="width:${m.width}px;height:${m.height}px;page-break-after:always;overflow:hidden">${html}</section>`);
  }
  return parts.join('\n');
}

// 极简 PPTX：用 puppeteer 截图 + 简单 OOXML 拼装。
// 为了零依赖、可读，生成"每页一张全图"的 PPTX（图片填满幻灯片）。
async function buildPptx(pngs, m, outFile) {
  const { buildPptxFromImages } = await import('../util/pptx.js');
  await buildPptxFromImages(pngs, m, outFile);
}
